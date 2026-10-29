/*
 * Clean Spaces — PopClip extension
 * --------------------------------
 * Author:      Adrian Ramon
 * Version:     1.0
 * Date:        29 October 2026
 * Licence:     MIT (see LICENSE in the repository root)
 * Repository:  https://github.com/adrian-ramon/popclip-extensions
 *
 * Tidies the spacing in selected text, which is mostly needed after
 * copying from web pages, PDFs, emails and Word documents:
 *
 *   "Dear  John ,"          →  "Dear John,"      (double space, space before comma)
 *   "10\u00A0km"            →  "10 km"           (non-breaking space)
 *   "price\u200B list"      →  "price list"      (invisible zero-width space)
 *   "  indented\t\tline  "  →  "indented line"   (tabs, ends of lines)
 *   three blank lines       →  one blank line
 *
 * Some invisible or unusual characters are there on purpose, so they are
 * kept: non-breaking and thin spaces used as thousands separators
 * (1 234 567), full-width spaces in Chinese and Japanese text, zero-width
 * spaces in Thai, Lao, Khmer and Burmese (which mark word breaks), and the
 * zero-width joiners that hold together emoji such as the family emoji.
 *
 * Everything runs locally; no data leaves the Mac.
 */

// ---------------------------------------------------------------------------
// Character sets
// ---------------------------------------------------------------------------

// Characters with no width at all: zero-width space, word joiner,
// byte order mark, soft hyphen and the old Mongolian vowel separator.
// Zero-width joiners and non-joiners (U+200C, U+200D) are not listed,
// because emoji and many scripts need them.
const INVISIBLE = /[\u200B\u2060\uFEFF\u00AD\u180E]/u;

// Every character the cleaner may change, used in one pass over the text:
// the invisible ones above, plus spaces that look like a normal space but
// are a different character (no-break, ogham, en/em/thin/hair and friends,
// narrow no-break, medium mathematical and ideographic full-width spaces)
const SPECIAL = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\u2060\uFEFF\u00AD\u180E]/gu;

// Scripts that are written without spaces between words and use a
// zero-width space to show where a line may break
const NO_SPACE_SCRIPT = /[\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;

// Chinese, Japanese and Korean, where a full-width space is normal
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303F\uFF00-\uFFEF]/u;

// Narrow spaces that are used as thousands separators (1 234 567)
const NUMBER_SPACE = /[\u00A0\u2009\u202F]/u;

// Line breaks of every kind: Windows, old Mac, Unix and the two Unicode
// separators that turn up in text from some web pages
const LINE_BREAK = /\r\n|\r|\n|\u2028|\u2029/;

// Spaces and tabs inside a line (after odd spaces have become normal ones)
const HORIZONTAL = /[ \t\v\f]+/g;

// Signs that suggest the selection is code rather than prose, where spaces
// around ? and : (as in a ? b : c) must not be touched
const LOOKS_LIKE_CODE = /[{}<>=]|&&|\|\|/;

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

// Step 1: deals with odd and invisible characters in the whole text.
// Each one is replaced by a normal space or removed, unless its neighbours
// show that it is there on purpose.
function fixSpecialCharacters(text) {
  return text.replace(SPECIAL, (ch, offset) => {
    const before = text.charAt(offset - 1);
    const after = text.charAt(offset + 1);

    if (INVISIBLE.test(ch)) {
      // Word-break marker in Thai, Lao, Khmer or Burmese text
      if (ch === "\u200B" && (NO_SPACE_SCRIPT.test(before) || NO_SPACE_SCRIPT.test(after))) return ch;
      return "";
    }
    // Thousands separator between two digits
    if (NUMBER_SPACE.test(ch) && /\d/.test(before) && /\d/.test(after)) return ch;
    // Full-width space in Chinese, Japanese or Korean text
    if (ch === "\u3000" && (CJK.test(before) || CJK.test(after))) return ch;
    return " ";
  });
}

// Step 3 (optional): removes spaces before , . ; : ! ? and inside brackets,
// so "word , word" becomes "word, word" and "( word )" becomes "(word)".
// The punctuation must be followed by a space, a closing quote or the end of
// the line, so emoticons such as " :)" are left alone. So are ellipses
// (" ..." and ". . ."), as spacing around them is a matter of style.
function fixPunctuation(line) {
  return line
    .replace(/(\S) +([,.;:!?])(?=$|[\s"'\u201D\u2019])/g, (m, before, mark, offset) => {
      if (mark === "." && (before === "." || /^\s*\./.test(line.slice(offset + m.length)))) return m;
      return before + mark;
    })
    .replace(/\( +(?=\S)/g, "(")
    .replace(/(\S) +\)/g, "$1)");
}

// Step 4: limits blank lines. mode is "single" (at most one in a row),
// "remove" (none) or "keep" (leave them as they are).
function fixBlankLines(lines, mode) {
  if (mode === "keep") return lines;
  return lines.filter((line, i) => {
    if (line !== "") return true;
    if (mode === "remove") return false;
    return i === 0 || lines[i - 1] !== "";
  });
}

// Main entry point. Returns the cleaned text.
// options.blankLines:  "single" (default), "remove" or "keep"
// options.punctuation: true to remove spaces before punctuation (default)
// options.indent:      true to keep spaces and tabs at the start of lines
function clean(text, options = {}) {
  const blankLines = options.blankLines || "single";
  const punctuation = options.punctuation !== false;
  const indent = options.indent === true;

  // Keep Windows line endings if the text uses them, otherwise use Unix ones
  const newline = text.includes("\r\n") ? "\r\n" : "\n";

  // A selection made by triple-clicking ends with a line break. Set it aside
  // so the cleaned text still ends with one and doesn't join the next line.
  const ending = text.match(/(?:\r\n|\r|\n|\u2028|\u2029)$/);
  const body = ending ? text.slice(0, -ending[0].length) : text;

  // Step 1: odd and invisible characters
  const fixed = fixSpecialCharacters(body);
  const tidyPunctuation = punctuation && !LOOKS_LIKE_CODE.test(fixed);

  // Step 2: each line on its own. Runs of spaces and tabs become one space,
  // and spaces at the start (unless kept) and end of the line are removed.
  const lines = fixed.split(LINE_BREAK).map((line) => {
    const lead = indent ? line.match(/^[ \t]*/)[0] : "";
    let rest = line.slice(lead.length).replace(HORIZONTAL, " ").trim();
    // Step 3: spaces before punctuation
    if (tidyPunctuation) rest = fixPunctuation(rest);
    // A line with nothing on it is blank, whatever its indentation was
    return rest === "" ? "" : lead + rest;
  });

  // Step 4: blank lines
  const kept = fixBlankLines(lines, blankLines);
  return kept.join(newline) + (ending ? newline : "");
}

// ---------------------------------------------------------------------------
// When the button appears
// ---------------------------------------------------------------------------

// To keep the PopClip bar tidy, the button only appears when the selection
// has something to clean: two spaces in a row, a tab, an odd or invisible
// character, a space at the start or end of a line, two or more blank lines
// in a row, or a space before punctuation. Text that is already clean
// doesn't bring it up.
const VISIBILITY = new RegExp([
  "[ \\t]{2,}|\\t",
  SPECIAL.source,
  "^[ \\t]|[ \\t]$|[ \\t](?:\\r?\\n|\\r)|(?:\\n|\\r)[ \\t]",
  "(?:\\r?\\n|\\r)[ \\t]*(?:\\r?\\n|\\r)[ \\t]*(?:\\r?\\n|\\r)",
  "\\S [,.;:!?](?:\\s|$)|\\( | \\)",
].join("|"), "u");

// ---------------------------------------------------------------------------
// PopClip action
// ---------------------------------------------------------------------------

// Delivers the result the same way as the other extensions in this set:
// ⌥-click replaces the selection, ⇧-click shows the result, and a plain
// click does whatever the "Plain click" option says.
function deliver(text, options) {
  const result = clean(text, options);
  if (result === text) {
    popclip.showText("Spacing is already clean");
  } else if (popclip.modifiers.option) {
    popclip.pasteText(result);
  } else if (popclip.modifiers.shift) {
    popclip.showText(result);
  } else if (options.output === "copy") {
    popclip.copyText(result);
  } else if (options.output === "show") {
    popclip.showText(result);
  } else {
    popclip.pasteText(result);
  }
}

exports.actions = [
  {
    title: "Clean Spaces",
    regex: VISIBILITY,
    code: (input, options) => deliver(input.text, options),
  },
];

// Extra exports for the test script; PopClip itself has no "process" object
if (typeof process !== "undefined") {
  Object.assign(exports, { clean, fixSpecialCharacters, fixPunctuation, VISIBILITY });
}
