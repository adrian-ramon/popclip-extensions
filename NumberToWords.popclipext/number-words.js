// Converts a selected number or currency amount to British English words.
// Mirrors TextFormatter: "£1,234.5" -> "One thousand, two hundred and thirty-four pounds and fifty pence"

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
// Short scale, as used in the UK since 1974; same names as TextFormatter (up to centillion)
const SCALES = [
  "", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion",
  "septillion", "octillion", "nonillion", "decillion", "undecillion", "duodecillion",
  "tredecillion", "quattuordecillion", "quindecillion", "sexdecillion", "septendecillion",
  "octodecillion", "novemdecillion", "vigintillion", "unvigintillion", "duovigintillion",
  "tresvigintillion", "quattuorvigintillion", "quinvigintillion", "sexvigintillion",
  "septenvigintillion", "octovigintillion", "novemvigintillion", "trigintillion",
  "untrigintillion", "duotrigintillion", "trestrigintillion", "quattuortrigintillion",
  "quintrigintillion", "sextrigintillion", "septentrigintillion", "octotrigintillion",
  "novemtrigintillion", "quadragintillion", "unquadragintillion", "duoquadragintillion",
  "tresquadragintillion", "quattuorquadragintillion", "quinquadragintillion",
  "sexquadragintillion", "septenquadragintillion", "octoquadragintillion",
  "novemquadragintillion", "quinquagintillion", "unquinquagintillion", "duoquinquagintillion",
  "tresquinquagintillion", "quattuorquinquagintillion", "quinquinquagintillion",
  "sexquinquagintillion", "septenquinquagintillion", "octoquinquagintillion",
  "novemquinquagintillion", "sexagintillion", "unsexagintillion", "duosexagintillion",
  "tressexagintillion", "quattuorsexagintillion", "quinsexagintillion", "sexsexagintillion",
  "septensexagintillion", "octosexagintillion", "novemsexagintillion", "septuagintillion",
  "unseptuagintillion", "duoseptuagintillion", "tresseptuagintillion",
  "quattuorseptuagintillion", "quinseptuagintillion", "sexseptuagintillion",
  "septenseptuagintillion", "octoseptuagintillion", "novemseptuagintillion", "octogintillion",
  "unoctogintillion", "duoctogintillion", "tresoctogintillion", "quattuoroctogintillion",
  "quinoctogintillion", "sexoctogintillion", "septenoctogintillion", "octooctogintillion",
  "novemoctogintillion", "nonagintillion", "unnonagintillion", "duononagintillion",
  "tresnonagintillion", "quattuornonagintillion", "quinnonagintillion", "sexnonagintillion",
  "septennonagintillion", "octononagintillion", "novemnonagintillion", "centillion"
];

const CURRENCIES = {
  GBP: { major: ["pound", "pounds"], minor: ["penny", "pence"] },
  USD: { major: ["dollar", "dollars"], minor: ["cent", "cents"] },
  EUR: { major: ["euro", "euros"], minor: ["cent", "cents"] },
};
const SYMBOLS = { "£": "GBP", "$": "USD", "€": "EUR" };

function underHundred(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
}

function underThousand(n) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundreds) parts.push(ONES[hundreds] + " hundred");
  if (rest) parts.push(underHundred(rest));
  return parts.join(" and ");
}

// Whole number given as a digit string, so values beyond 2^53 stay exact
function integerToWords(digits) {
  digits = digits.replace(/^0+(?=\d)/, "");
  if (/^0+$/.test(digits)) return "zero";
  const groups = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(Number(digits.slice(Math.max(0, end - 3), end)));
  }
  if (groups.length > SCALES.length) throw new Error("Number too large");
  const parts = [];
  groups.forEach((g, i) => {
    if (!g) return;
    const scale = SCALES[groups.length - 1 - i];
    parts.push(underThousand(g) + (scale ? " " + scale : ""));
  });
  // British style: "one thousand and five", but "one thousand, two hundred"
  const last = groups[groups.length - 1];
  if (parts.length > 1 && last > 0 && last < 100) {
    const tail = parts.pop();
    return parts.join(", ") + " and " + tail;
  }
  return parts.join(", ");
}

// Round a digit string pair to two decimal places without floating-point error
function roundToPence(intPart, fracPart) {
  const frac = (fracPart + "000").slice(0, 3);
  let pence = Number(frac.slice(0, 2)) + (Number(frac[2]) >= 5 ? 1 : 0);
  if (pence === 100) {
    pence = 0;
    intPart = incrementDigits(intPart);
  }
  return [intPart, pence];
}

function incrementDigits(digits) {
  const arr = digits.split("");
  let i = arr.length - 1;
  while (i >= 0 && arr[i] === "9") arr[i--] = "0";
  if (i < 0) arr.unshift("1"); else arr[i] = String(Number(arr[i]) + 1);
  return arr.join("");
}

// Separators people use to group thousands: comma, full stop, apostrophe (Swiss) and spaces (French, SI)
const SPACES = /[ \u00a0\u2009\u202f]/g;

// Checks the whole-number part is grouped consistently: 12,345,678 (Western) or 1,23,45,678 (Indian)
function validGrouping(whole) {
  if (/^\d+$/.test(whole)) return true;
  const sep = whole.match(/\D/)[0];
  const groups = whole.split(sep);
  if (!groups.every((g) => /^\d+$/.test(g))) return false;
  const western = /^\d{1,3}$/.test(groups[0]) && groups.slice(1).every((g) => /^\d{3}$/.test(g));
  const indian = sep === "," && groups.length > 2 && /^\d{1,2}$/.test(groups[0]) &&
    groups.slice(1, -1).every((g) => /^\d{2}$/.test(g)) && /^\d{3}$/.test(groups[groups.length - 1]);
  return western || indian;
}

// Splits "12.345.678,9" style digits into whole and fractional parts, working out which mark is the decimal
function splitNumber(core, decimalComma) {
  core = core.replace(SPACES, " ");
  const marks = core.match(/[.,]/g) || [];
  let dec = decimalComma ? "," : ".";
  if (/[ '’]/.test(core)) {
    // Spaces and apostrophes only ever group, so a single remaining mark is the decimal
    if (marks.length > 1) return null;
    if (marks.length) dec = marks[0];
  } else if (core.includes(".") && core.includes(",")) {
    dec = core.lastIndexOf(".") > core.lastIndexOf(",") ? "." : ",";
  } else if (marks.length > 1 && marks.every((m) => m === dec)) {
    // 12.345.678 (or 1,234,567 with decimal commas): repeated marks must be grouping
    dec = dec === "." ? "," : ".";
  }
  const [whole, frac = "", extra] = core.split(dec);
  if (extra !== undefined || !/^\d*$/.test(frac) || !validGrouping(whole)) return null;
  return { intPart: whole.replace(/\D/g, ""), fracPart: frac };
}

function parse(text, decimalComma) {
  const t = text.trim();
  const m = t.match(/^([-−])?\s*([£$€])?\s*([-−])?\s*(\d(?:[\d.,'’ \u00a0\u2009\u202f]*\d)?)\s*(GBP|USD|EUR)?$/i);
  if (!m) return null;
  const parts = splitNumber(m[4], decimalComma);
  if (!parts) return null;
  const code = m[5] ? m[5].toUpperCase() : (m[2] ? SYMBOLS[m[2]] : null);
  return { negative: Boolean(m[1] || m[3]), currency: code, ...parts };
}

function toWords(text, decimalComma) {
  const p = parse(text, decimalComma);
  if (!p) throw new Error("Not a number");
  const sign = p.negative ? "minus " : "";

  if (!p.currency) {
    let words = integerToWords(p.intPart);
    if (p.fracPart) words += " point " + p.fracPart.split("").map((d) => ONES[Number(d)]).join(" ");
    return sign + words;
  }

  const cur = CURRENCIES[p.currency];
  const [intPart, pence] = roundToPence(p.intPart, p.fracPart);
  const isZero = /^0+$/.test(intPart);
  const parts = [];
  if (!isZero || !pence) {
    parts.push(integerToWords(intPart) + " " + cur.major[intPart.replace(/^0+(?=\d)/, "") === "1" ? 0 : 1]);
  }
  if (pence) parts.push(underHundred(pence) + " " + cur.minor[pence === 1 ? 0 : 1]);
  return sign + parts.join(" and ");
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Number shapes accepted inside running text. Plain spaces and repeated full stops are left out,
// because in text they are more often lists, phone numbers or IP addresses than grouping.
const GROUPED = String.raw`\d{1,3}(?:['’]\d{3})+|\d{1,3}(?:[\u00a0\u2009\u202f]\d{3})+`;
const CORE_POINT = String.raw`(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})+,\d{3}|${GROUPED}|\d+)(?:\.\d+)?`;
const CORE_COMMA = String.raw`(?:\d{1,3}(?:\.\d{3})+|${GROUPED}|\d+)(?:,\d+)?`;
// A number or amount that stands on its own: not part of a word, code, date, time, range or version
function numberPattern(core) {
  return String.raw`(^|[^\w.,\/:\-−£$€])((?:[-−]\s?)?[£$€]?\s?[-−]?${core}(?:\s?(?:GBP|USD|EUR)\b)?)(\s?%)?(?![\w\/:]|[.,\-−]\d|\s\d)`;
}

// Converts every number in the text; a selection that is only a number becomes just its words
function convertText(text, cap, decimalComma) {
  const whole = text.trim().match(/^(.*?)(\s?%)?$/s);
  if (parse(whole[1], decimalComma)) {
    const words = toWords(whole[1], decimalComma) + (whole[2] ? " per cent" : "");
    return cap ? capitalise(words) : words;
  }
  let count = 0;
  const re = new RegExp(numberPattern(decimalComma ? CORE_COMMA : CORE_POINT), "gi");
  const out = text.replace(re, (match, before, number, percent, offset) => {
    const start = offset + before.length;
    // Leave alone digit runs that look like phone numbers or codes: "07700 900 123", "0800"
    if (/^\D*0\d/.test(number) || /\d\s$/.test(text.slice(0, start)) || !parse(number, decimalComma)) return match;
    let words = toWords(number, decimalComma) + (percent ? " per cent" : "");
    if (cap && /^\s*$|[.!?]\s+$/.test(text.slice(0, start))) words = capitalise(words);
    count++;
    return before + words;
  });
  return count ? out : null;
}

if (typeof popclip !== "undefined") {
  const result = convertText(popclip.input.text, popclip.options.capitalise, popclip.options.decimal === "comma");
  if (result === null) {
    popclip.showText("No number found");
  } else if (popclip.modifiers.option) {
    popclip.pasteText(result);
  } else if (popclip.modifiers.shift) {
    popclip.showText(result);
  } else {
    switch (popclip.options.output) {
      case "paste": popclip.pasteText(result); break;
      case "show": popclip.showText(result); break;
      default: popclip.copyText(result);
    }
  }
} else if (typeof module !== "undefined") {
  module.exports = { toWords, convertText, numberPattern, CORE_POINT, CORE_COMMA };
}
