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

function parse(text) {
  const t = text.trim();
  const m = t.match(/^([-−])?\s*([£$€])?\s*([-−])?\s*([\d,]+)(?:\.(\d+))?\s*(GBP|USD|EUR)?$/i);
  if (!m) return null;
  const code = m[6] ? m[6].toUpperCase() : (m[2] ? SYMBOLS[m[2]] : null);
  return {
    negative: Boolean(m[1] || m[3]),
    currency: code,
    intPart: m[4].replace(/,/g, ""),
    fracPart: m[5] || "",
  };
}

function toWords(text) {
  const p = parse(text);
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

// A number or amount that stands on its own: not part of a word, code, date, time, range or version
const NUMBER = /(^|[^\w.,\/:\-−£$€])((?:[-−]\s?)?[£$€]?\s?[-−]?\d(?:(?:,\d{3})+|\d*)(?:\.\d+)?(?:\s?(?:GBP|USD|EUR)\b)?)(\s?%)?(?![\w\/:]|[.,\-−]\d)/gi;

// Converts every number in the text; a selection that is only a number becomes just its words
function convertText(text, cap) {
  let count = 0;
  const out = text.replace(NUMBER, (match, before, number, percent, offset) => {
    let words = toWords(number) + (percent ? " per cent" : "");
    const start = offset + before.length;
    if (cap && /^\s*$|[.!?]\s+$/.test(text.slice(0, start))) words = capitalise(words);
    count++;
    return before + words;
  });
  return count ? out : null;
}

if (typeof popclip !== "undefined") {
  const result = convertText(popclip.input.text, popclip.options.capitalise);
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
  module.exports = { toWords, convertText, NUMBER };
}
