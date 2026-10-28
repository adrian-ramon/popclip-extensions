// Adds (or converts) thousands separators in selected numbers: "12345678.9" -> "12,345,678.9"
// Understands numbers already grouped in another style, e.g. "1.234.567,89" or "12,34,567"

const SPACES = "    ";
const APOSTROPHES = "'’";

const STYLES = {
  comma: { group: ",", decimal: "." },
  dot: { group: ".", decimal: "," },
  "space-comma": { group: "space", decimal: "," },
  "space-point": { group: "space", decimal: "." },
  apostrophe: { group: "’", decimal: "." },
  indian: { group: ",", decimal: ".", indian: true },
};
const SPACE_CHARS = { thin: " ", nbsp: " ", plain: " " };

// Separators from macOS settings (older PopClip builds without util.localeInfo fall back to Intl);
// lakh grouping is detected through Intl, as macOS reports only the separator characters
function systemStyle(info) {
  info = info || {};
  let group = info.groupingSeparator;
  let decimal = info.decimalSeparator;
  let indian = info.regionCode === "IN";
  try {
    const locale = (info.localeIdentifier || "").replace(/_/g, "-").replace(/@.*/, "");
    const parts = new Intl.NumberFormat(locale || undefined).formatToParts(1234567.5);
    const part = (type) => (parts.find((p) => p.type === type) || {}).value;
    group = group || part("group");
    decimal = decimal || part("decimal");
    indian = indian || parts.filter((p) => p.type === "integer").map((p) => p.value).join(",") === "12,34,567";
  } catch (e) {
    // Intl unavailable: keep what macOS reported
  }
  group = group || ",";
  decimal = decimal || ".";
  if (group === decimal) [group, decimal] = [",", "."];
  return { group, decimal, indian };
}

function resolveStyle(options, info) {
  const sys = systemStyle(info);
  const chosen = STYLES[options.style] || sys;
  const style = Object.assign({}, chosen, { systemDecimal: sys.decimal });
  if (style.group === "space") style.group = SPACE_CHARS[options.space] || SPACE_CHARS.thin;
  style.ungroupFour = Boolean(options.ungroupFour);
  return style;
}

// Western 1,234,567 with any separator, or Indian 12,34,567 with commas only
function validGroups(parts, sep) {
  if (parts.length < 2) return true;
  const [first, ...rest] = parts;
  const last = rest.pop();
  if (last.length !== 3 || !/^\d{1,3}$/.test(first)) return false;
  if (rest.every((p) => p.length === 3)) return true;
  return sep === "," && first.length <= 2 && rest.every((p) => p.length === 2);
}

function isSpace(c) { return SPACES.includes(c); }
function sameKind(a, b) { return a === b || (isSpace(a) && isSpace(b)) || (APOSTROPHES.includes(a) && APOSTROPHES.includes(b)); }

// Works out which separator is grouping and which is decimal.
// Returns { intPart, fracPart } as digit strings, or null if the digits don't read as one number.
function interpret(num, style, inText) {
  const seps = num.match(/\D/g) || [];
  if (!seps.length) return { intPart: num, fracPart: "" };
  const kinds = [];
  seps.forEach((c) => { if (!kinds.some((k) => sameKind(k, c))) kinds.push(c); });
  if (kinds.length > 2) return null;

  const splitInt = (s, sep) => s.split(new RegExp("[" + (isSpace(sep) ? SPACES : APOSTROPHES.includes(sep) ? APOSTROPHES : sep) + "]"));
  const grouped = (intText, sep, fracPart) => {
    const parts = splitInt(intText, sep);
    return validGroups(parts, sep) ? { intPart: parts.join(""), fracPart } : null;
  };

  // Two kinds of mark: the last one is the decimal, and appears only once
  if (kinds.length === 2) {
    const dec = seps[seps.length - 1];
    if (!".,".includes(dec) || seps.filter((c) => c === dec).length > 1) return null;
    const at = num.lastIndexOf(dec);
    return grouped(num.slice(0, at), kinds[0], num.slice(at + 1));
  }

  const c = kinds[0];
  // In running text 192.168.100.200 is far more likely an address than 192 billion
  if (inText && c === "." && seps.length > 1) return null;
  if (seps.length > 1 || !".,".includes(c)) return grouped(num, c, "");

  const at = num.indexOf(c);
  const left = num.slice(0, at);
  const right = num.slice(at + 1);
  let isDecimal;
  if (right.length !== 3 || left.length > 3 || left === "0") {
    isDecimal = true;
    // In running text, "1,2" in an English document is more likely a list than a decimal
    if (inText && c !== style.systemDecimal && c !== style.decimal) return null;
  } else if (c === style.group) {
    isDecimal = false; // already in the chosen style
  } else {
    isDecimal = c === style.systemDecimal;
  }
  return isDecimal ? { intPart: left, fracPart: right } : { intPart: left + right, fracPart: "" };
}

function groupDigits(digits, style) {
  if (digits.length <= 3 || (digits.length === 4 && style.ungroupFour)) return digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  const size = style.indian ? 2 : 3;
  const groups = [];
  for (let end = head.length; end > 0; end -= size) groups.unshift(head.slice(Math.max(0, end - size), end));
  return groups.concat(tail).join(style.group);
}

// Returns the reformatted number, or null to leave it as it was
function formatNumber(num, style, inText) {
  const p = interpret(num, style, inText);
  if (!p || !p.intPart) return null;
  if (p.intPart.length > 1 && p.intPart[0] === "0") return null; // codes, phone numbers
  // A bare four-digit number in running text is usually a year
  if (inText && num.length === 4 && /^\d{4}$/.test(num)) return null;
  return groupDigits(p.intPart, style) + (p.fracPart ? style.decimal + p.fracPart : "");
}

const SEP_CLASS = ",.'’   ";
// Selection that is just one number, optionally with a sign, currency or unit around it
const WHOLE = new RegExp("^([^\\p{L}\\d]*(?:\\p{Lu}{3}\\s?)?[^\\p{L}\\d]*?)(\\d(?:[" + SEP_CLASS + " ]?\\d)*)([^\\p{L}\\d]*(?:\\s?\\p{L}{1,3})?[^\\p{L}\\d]*)$", "u");
// A number inside text: not part of a word, code, date, time, range or version
const IN_TEXT = new RegExp("(^|[^\\w" + SEP_CLASS + "\\/:\\-−#+@])((?:[-−]\\s?)?)(\\d(?:[" + SEP_CLASS + "]?\\d)*)(?![\\w\\/:]|[" + SEP_CLASS + "\\-−]\\d)", "g");

// Returns the new text, or null if no number needed changing
function convertText(text, style) {
  const whole = text.match(WHOLE);
  let out;
  if (whole) {
    const formatted = formatNumber(whole[2], style, false);
    out = formatted === null ? text : whole[1] + formatted + whole[3];
  } else {
    out = text.replace(IN_TEXT, (match, before, sign, num) => {
      const formatted = formatNumber(num, style, true);
      return formatted === null ? match : before + sign + formatted;
    });
  }
  return out === text ? null : out;
}

if (typeof popclip !== "undefined") {
  const style = resolveStyle(popclip.options, typeof util !== "undefined" ? util.localeInfo : null);
  const result = convertText(popclip.input.text, style);
  if (result === null) {
    popclip.showText("Nothing to format");
  } else if (popclip.modifiers.option) {
    popclip.pasteText(result);
  } else if (popclip.modifiers.shift) {
    popclip.showText(result);
  } else {
    switch (popclip.options.output) {
      case "copy": popclip.copyText(result); break;
      case "show": popclip.showText(result); break;
      default: popclip.pasteText(result);
    }
  }
} else if (typeof module !== "undefined") {
  module.exports = { convertText, formatNumber, resolveStyle, systemStyle, STYLES };
}
