/*
 * Superscript — PopClip extension
 * -------------------------------
 * Author:      Adrian Ramon
 * Version:     1.0
 * Date:        28 October 2026
 * Licence:     MIT (see LICENSE in the repository root)
 * Repository:  https://github.com/adrian-ramon/popclip-extensions
 *
 * Turns selected text into Unicode superscript or subscript characters,
 * so it works anywhere text can be typed, including plain-text fields:
 *
 *   177.97 m3     →  177.97 m³      (units: the x² button)
 *   x^2, 10^-6    →  x², 10⁻⁶        (caret powers: the x² button)
 *   CO2, H2SO4    →  CO₂, H₂SO₄      (chemical formulas: the x₂ button)
 *   x_1           →  x₁              (underscore indices: the x₂ button)
 *
 * If the selection contains none of those patterns, the whole selection
 * is converted instead (select "2" to get "²"). Clicking a button on
 * text that already contains its kind of character turns it back to
 * normal, so H₂O becomes H2O again.
 *
 * Everything runs locally; no data leaves the Mac.
 */

// ---------------------------------------------------------------------------
// Character tables
// ---------------------------------------------------------------------------

// Every character Unicode has a superscript form for. Letters missing here
// (lowercase q; capitals C, F, Q, S, X, Y, Z) have no superscript form.
const SUPERSCRIPT = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ",
  j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ",
  t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
  A: "ᴬ", B: "ᴮ", D: "ᴰ", E: "ᴱ", G: "ᴳ", H: "ᴴ", I: "ᴵ", J: "ᴶ", K: "ᴷ",
  L: "ᴸ", M: "ᴹ", N: "ᴺ", O: "ᴼ", P: "ᴾ", R: "ᴿ", T: "ᵀ", U: "ᵁ", V: "ⱽ",
  W: "ᵂ",
};

// Subscript is much patchier: digits, signs, brackets and 17 lowercase
// letters. There are no subscript capitals at all.
const SUBSCRIPT = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ",
  o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

// Reverse tables for turning converted text back to normal. Where two
// characters share a form (- and −), the first one listed (-) wins.
function invert(map) {
  const out = {};
  for (const [plain, small] of Object.entries(map)) {
    if (!(small in out)) out[small] = plain;
  }
  return out;
}

// Escapes characters for use inside a regular expression [...] class
function charClass(chars) {
  return chars.map((c) => c.replace(/[\\\]^-]/g, "\\$&")).join("");
}

// ---------------------------------------------------------------------------
// Smart patterns
// ---------------------------------------------------------------------------

// Length and area/volume units that are written with a power: m2, cm3, km2.
// Lowercase only, so names such as "M3" (a road) are left alone. "in" is
// deliberately missing, as "in2" is more often a typo than square inches.
const UNIT = "mm|cm|dm|km|nm|µm|μm|m|ft|yd|mi";
// Unit followed by 2 or 3, not glued to letters on either side.
// Group 1 is whatever came before; it is put back unchanged.
const UNIT_POWER = new RegExp("(^|[^\\p{L}])(" + UNIT + ")([23])(?![\\p{L}\\d])", "gu");
// "per second squared", as in m/s2
const PER_SECOND = /(\/s)(2)(?![\p{L}\d])/gu;
// Caret powers: x^2, 10^-6, e^x, 2^(n+1). The exponent is digits (with an
// optional sign), a single letter, or anything in brackets.
const CARET = /(\S)\^(?:\(([^()]+)\)|([-−+]?\d+|\p{L})(?![\p{L}\d]))/gu;

// Underscore indices, as used in maths and LaTeX: x_1, a_n.
// Only after a single letter, so identifiers like file_name are left alone.
const UNDERSCORE = /(^|[^\p{L}\d_])(\p{L})_(\d+|\p{Ll})(?![\p{L}\d_])/gu;

// Chemical symbols, used to recognise formulas such as CO2 or Ca(OH)2
const ELEMENTS = new Set((
  "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn " +
  "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce " +
  "Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn " +
  "Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl " +
  "Mc Lv Ts Og"
).split(" "));
// Single-element molecules that are common enough to recognise on their own
const SINGLE_ELEMENT = new Set(["H2", "O2", "O3", "N2", "Cl2", "Br2", "I2", "S8", "P4"]);
// Names that happen to parse as formulas but are not chemistry
const NOT_FORMULAS = new Set(["PS2", "PS3", "PS4", "PS5", "W3C", "B2C", "B2B", "P2P", "Y2K"]);
// A candidate formula: optional leading count (the 5 in 5H2O), then element
// symbols, counts and bracketed groups. Checked properly by isFormula().
const FORMULA = /(^|[^\p{L}\d])(\d*)((?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+)(?![\p{L}\d])/gu;

// Decides whether a candidate token really is a chemical formula
function isFormula(token) {
  if (NOT_FORMULAS.has(token) || !/\d/.test(token)) return false;
  const symbols = token.match(/[A-Z][a-z]?/g) || [];
  if (!symbols.every((s) => ELEMENTS.has(s))) return false;
  // Chemists never write a count of 1, or one starting with 0
  if ((token.match(/\d+/g) || []).some((n) => n === "1" || n[0] === "0")) return false;
  // The same symbol twice in a row (B2B, P2P) is not how formulas are written
  if (symbols.some((s, i) => i > 0 && s === symbols[i - 1])) return false;
  return symbols.length >= 2 || SINGLE_ELEMENT.has(token);
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

// Converts every character using the given table.
// Returns { text } on success, or { missing } listing characters with no form.
function convertAll(text, map) {
  const missing = [];
  let out = "";
  for (const ch of text) {
    if (map[ch]) out += map[ch];
    else if (/\s/.test(ch)) out += ch;
    else if (!missing.includes(ch)) missing.push(ch);
  }
  return missing.length ? { missing } : { text: out };
}

// Converts only the part of the selection that needs it, using the smart
// patterns above for the chosen direction. Returns the new text, which is
// the same as the input if nothing matched.
function smartConvert(text, kind) {
  const map = kind === "sup" ? SUPERSCRIPT : SUBSCRIPT;
  // Replace a part only if every character in it has a form; otherwise keep it
  const small = (part, original) => {
    const r = convertAll(part, map);
    return r.text === undefined ? original : r.text;
  };

  if (kind === "sup") {
    return text
      .replace(UNIT_POWER, (m, before, unit, power) => before + unit + map[power])
      .replace(PER_SECOND, (m, unit, power) => unit + map[power])
      .replace(CARET, (m, base, bracketed, simple) => base + small(bracketed || simple, m.slice(1)));
  }

  return text
    .replace(FORMULA, (m, before, count, formula) =>
      isFormula(formula) ? before + count + formula.replace(/\d+/g, (n) => small(n, n)) : m)
    .replace(UNDERSCORE, (m, before, base, index) => {
      const r = convertAll(index, map);
      return r.text === undefined ? m : before + base + r.text;
    });
}

// Main entry point for both buttons.
// kind is "sup" or "sub". Returns { text } with the result, or { message }
// explaining why nothing could be done.
function transform(text, kind) {
  const map = kind === "sup" ? SUPERSCRIPT : SUBSCRIPT;
  const name = kind === "sup" ? "superscript" : "subscript";

  // 1. Already converted? Turn this kind of character back to normal.
  const back = invert(map);
  if ([...text].some((ch) => back[ch])) {
    return { text: [...text].map((ch) => back[ch] || ch).join("") };
  }

  // 2. A single letter followed by a number, selected on its own:
  //    "x2" means x², not ˣ², and "x1" means x₁.
  const variable = text.match(/^(\s*\p{L})(\d+)(\s*)$/u);
  if (variable && !(kind === "sub" && isFormula(variable[1].trim() + variable[2]))) {
    return { text: variable[1] + convertAll(variable[2], map).text + variable[3] };
  }

  // 3. Units, powers, formulas and indices inside the text
  const smart = smartConvert(text, kind);
  if (smart !== text) return { text: smart };

  // 4. Nothing recognised, so convert the whole selection
  const all = convertAll(text, map);
  if (all.text !== undefined) {
    return all.text === text ? { message: "Nothing to convert" } : { text: all.text };
  }
  // A short selection gets told exactly which characters are the problem;
  // a longer one just had nothing in it worth converting
  if (text.replace(/\s/g, "").length > 12) return { message: "Nothing to convert" };
  return { message: "No " + name + " form for: " + all.missing.join(" ") };
}

// ---------------------------------------------------------------------------
// When the buttons appear
// ---------------------------------------------------------------------------

// To keep the PopClip bar tidy, each button only appears when the selection
// has something it can work on: a recognised pattern, characters it can turn
// back, a single character, or a short run of digits and signs (with up to
// three characters in all if letters are mixed in, such as "n+1" or "x2").
// Ordinary words like "of" therefore don't bring up the buttons.
function visibility(kind) {
  const map = kind === "sup" ? SUPERSCRIPT : SUBSCRIPT;
  const plain = charClass(Object.keys(map));
  const small = charClass(Object.values(map));
  const signs = "0-9+\\-−=()";
  const short = "^\\s*(?:[" + plain + "]|[" + signs + " ]{1,20}|(?=\\S*[" + signs + "])[" + plain + "]{2,3})\\s*$";
  const patterns = kind === "sup"
    ? [UNIT_POWER.source, PER_SECOND.source, "\\S\\^[-−+(\\p{L}\\d]"]
    : ["[A-Z][a-z]?\\d", "\\p{L}_[\\p{L}\\d]"];
  return new RegExp([short, "[" + small + "]"].concat(patterns).join("|"), "u");
}

// ---------------------------------------------------------------------------
// PopClip actions
// ---------------------------------------------------------------------------

// Delivers the result the same way as Number to Words and Number Formatter:
// ⌥-click replaces the selection, ⇧-click shows the result, and a plain
// click does whatever the "Plain click" option says.
function deliver(text, kind, options) {
  const result = transform(text, kind);
  if (result.message) {
    popclip.showText(result.message);
  } else if (popclip.modifiers.option) {
    popclip.pasteText(result.text);
  } else if (popclip.modifiers.shift) {
    popclip.showText(result.text);
  } else if (options.output === "copy") {
    popclip.copyText(result.text);
  } else if (options.output === "show") {
    popclip.showText(result.text);
  } else {
    popclip.pasteText(result.text);
  }
}

const ICON_SUP = 'svg:<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26l26 30M32 26L6 56"/><path d="M41 15a7 7 0 1 1 12 5L41 32h15"/></g></svg>';
const ICON_SUB = 'svg:<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l26 30M32 8L6 38"/><path d="M41 37a7 7 0 1 1 12 5L41 54h15"/></g></svg>';

exports.actions = [
  {
    title: "Superscript",
    icon: ICON_SUP,
    regex: visibility("sup"),
    code: (input, options) => deliver(input.text, "sup", options),
  },
  {
    title: "Subscript",
    icon: ICON_SUB,
    regex: visibility("sub"),
    code: (input, options) => deliver(input.text, "sub", options),
  },
];

// Extra exports for the test script; PopClip itself has no "process" object
if (typeof process !== "undefined") {
  Object.assign(exports, { transform, smartConvert, isFormula, visibility });
}
