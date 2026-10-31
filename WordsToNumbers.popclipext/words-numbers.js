/*
 * Words to Numbers — PopClip extension
 * ------------------------------------
 * Author:      Adrian Ramon
 * Version:     1.0
 * Date:        31 October 2026
 * Licence:     MIT (see LICENSE in the repository root)
 * Repository:  https://github.com/adrian-ramon/popclip-extensions
 *
 * Turns numbers written in English words back into digits. It is the
 * reverse of the Number to Words extension:
 *
 *   two thousand and five                      →  2005
 *   twenty-five hundred                        →  2500
 *   a hundred and fifty                        →  150
 *   three point one four                       →  3.14
 *   two point five million pounds              →  £2,500,000
 *   twelve pounds and thirty pence             →  £12.30
 *   fifteen per cent                           →  15%
 *   twenty-first                               →  21st
 *   nineteen sixty-nine                        →  1969
 *
 * A selection that is only a number becomes just its digits. In longer
 * text, number phrases worth ten or more are converted and one to nine are
 * left as words, as most British style guides recommend, so "one of the
 * twenty-five reasons" becomes "one of the 25 reasons".
 *
 * Everything runs locally; no data leaves the Mac.
 */

// ---------------------------------------------------------------------------
// Word tables
// ---------------------------------------------------------------------------

// Values of the words for 0 to 19.
const UNITS = {
  zero: 0, nought: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
// Values of the multiples of ten.
const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
// Words that can stand for a single digit after "point" ("three point oh five").
const DIGITS = { ...UNITS, oh: 0, o: 0 };
// Scale words and the power of ten each stands for. Short scale (a billion is
// a thousand million), as used in the UK since 1974, the same list Number to
// Words uses, all the way up to centillion (10^303).
const SCALE_NAMES = [
  "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion",
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
  "septennonagintillion", "octononagintillion", "novemnonagintillion", "centillion",
];
const SCALES = Object.fromEntries(SCALE_NAMES.map((name, i) => [name, 3 * (i + 1)]));

// Ordinal words whose cardinal isn't just the word without "th".
const IRREGULAR_ORDINALS = {
  first: "one", second: "two", third: "three", fifth: "five", eighth: "eight",
  ninth: "nine", twelfth: "twelve",
};

// Currency words. Each major unit (pound) has its symbol and the minor unit
// (pence) that goes with it.
const MAJOR = {
  pound: "£", pounds: "£", quid: "£",
  dollar: "$", dollars: "$",
  euro: "€", euros: "€",
};
const MINOR = { penny: "£", pence: "£", p: "£", cent: "¢", cents: "¢" };

// ---------------------------------------------------------------------------
// Splitting text into words
// ---------------------------------------------------------------------------

// Turns an ordinal word into its cardinal ("twenty-first" is read as the
// tokens "twenty" and "first", so only single words need handling here):
// "first" → "one", "twentieth" → "twenty", "hundredth" → "hundred".
function cardinalOf(word) {
  if (IRREGULAR_ORDINALS[word]) return IRREGULAR_ORDINALS[word];
  if (word.endsWith("ieth") && TENS[word.slice(0, -4) + "y"] !== undefined) return word.slice(0, -4) + "y";
  if (word.endsWith("th")) {
    const base = word.slice(0, -2);
    if (UNITS[base] !== undefined || base === "hundred" || SCALES[base]) return base;
  }
  return null;
}

// Splits text into word tokens, remembering where each one starts and ends
// so a number phrase can be swapped for its digits in place. Ordinals are
// stored as their cardinal word with an "ordinal" flag.
function tokenise(text) {
  const tokens = [];
  const re = /[A-Za-z]+/g;
  let m;
  while ((m = re.exec(text))) {
    const lower = m[0].toLowerCase();
    const cardinal = cardinalOf(lower);
    tokens.push({
      word: cardinal || lower,
      ordinal: Boolean(cardinal),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Reading a number phrase
// ---------------------------------------------------------------------------

// A small recursive-descent reader over the tokens. Each read* method looks at
// the tokens from position i and returns what it understood plus the position
// after it, or null if the words there aren't that part of a number. Values are
// BigInts so very large numbers stay exact.
class Reader {
  constructor(text, tokens) {
    this.text = text;
    this.tokens = tokens;
  }

  // The word at position i, or undefined past the end.
  word(i) {
    return this.tokens[i] && this.tokens[i].word;
  }

  // Whether token i follows token i-1 closely enough to belong to the same
  // number: separated only by spaces or a hyphen on one line (and, straight
  // after a scale word, a comma: "one thousand, two hundred"). An ordinal
  // always ends a number, so nothing may follow one.
  joins(i, allowComma) {
    const prev = this.tokens[i - 1];
    const next = this.tokens[i];
    if (!prev || !next || prev.ordinal) return false;
    const gap = this.text.slice(prev.end, next.start);
    if (/^[^\S\n]+$|^[^\S\n]*[-‐‑–][^\S\n]*$/.test(gap)) return true;
    return Boolean(allowComma) && /^,[^\S\n]*$/.test(gap);
  }

  // 0 to 99: "seven", "nineteen", "forty-two", "forty two".
  readSmall(i) {
    const w = this.word(i);
    if (UNITS[w] !== undefined) return { value: UNITS[w], end: i + 1 };
    if (TENS[w] !== undefined) {
      const unit = UNITS[this.word(i + 1)];
      if (unit >= 1 && unit <= 9 && this.joins(i + 1)) return { value: TENS[w] + unit, end: i + 2 };
      return { value: TENS[w], end: i + 1 };
    }
    return null;
  }

  // Up to 9,999 with "hundred": "three hundred and six", "a hundred",
  // "twenty-five hundred" (2,500), or just a small number on its own.
  // "a" only counts as one when "hundred" or a scale word follows it.
  readHundreds(i) {
    let small;
    if (this.word(i) === "a" && this.joins(i + 1) &&
        (this.word(i + 1) === "hundred" || SCALES[this.word(i + 1)])) {
      small = { value: 1, end: i + 1, article: true };
    } else {
      small = this.readSmall(i);
    }
    if (!small) return null;
    let j = small.end;
    if (this.word(j) !== "hundred" || !this.joins(j) || small.value === 0) {
      return small.article ? { value: 1, end: j, article: true } : { value: small.value, end: j, small: true };
    }
    let value = small.value * 100;
    j += 1;
    // Optional "and" (British) or nothing (American) before the tens and units
    const andAt = this.word(j) === "and" && this.joins(j) ? j + 1 : j;
    const rest = this.joins(andAt) && this.readSmall(andAt);
    if (rest && rest.value > 0) {
      value += rest.value;
      j = rest.end;
    }
    return { value, end: j };
  }

  // A whole number phrase, with an optional minus sign, decimals, currency
  // and "per cent". Returns { int, frac, sign, currency, minor, percent,
  // ordinal, end } or null.
  readNumber(i, wholeSelection) {
    const start = i;
    let sign = "";
    if ((this.word(i) === "minus" || this.word(i) === "negative") && this.joins(i + 1)) {
      sign = "-";
      i += 1;
    }

    // The whole-number part: groups of up to a thousand, each with a scale
    // word that must get smaller as it goes ("two million, three hundred
    // thousand and five").
    let total = 0n;
    let lastScale = Infinity;
    let usedScale = false;
    let j = i;
    let groups = 0;
    let firstGroup = null;
    while (true) {
      const at = groups === 0 ? j : this.afterAnd(j);
      if (groups > 0 && !this.joins(at, this.isScale(at - 1) || this.isScale(at - 2))) break;
      const group = this.readHundreds(at);
      if (!group) break;
      if (groups === 0) firstGroup = group;
      const scaleWord = this.word(group.end);
      let exp = SCALES[scaleWord];
      let scaleEnd = group.end + 1;
      // Older British "a thousand million" (a billion)
      if (scaleWord === "thousand" && SCALES[this.word(scaleEnd)] > 3 && this.joins(scaleEnd) &&
          !this.tokens[group.end].ordinal) {
        exp += SCALES[this.word(scaleEnd)];
        scaleEnd += 1;
      }
      if (exp && exp < lastScale && this.joins(group.end)) {
        total += BigInt(group.value) * 10n ** BigInt(exp);
        lastScale = exp;
        usedScale = true;
        j = scaleEnd;
        groups += 1;
        if (this.tokens[j - 1].ordinal) break;
        continue;
      }
      if (group.article) break; // "a" with nothing it can count
      // A final group must be smaller than the scale before it
      if (usedScale && group.value >= 1000) break;
      total += BigInt(group.value);
      j = group.end;
      groups += 1;
      break;
    }

    let frac = "";
    let ordinal = groups > 0 && this.tokens[j - 1].ordinal;

    // Year style: two pairs of digits said separately, "nineteen sixty-nine",
    // "twenty twenty-six", "nineteen oh five".
    if (groups === 1 && !usedScale && firstGroup.small && firstGroup.value >= 10 && !ordinal && this.joins(j)) {
      const year = this.readYearEnd(j);
      if (year) {
        total = BigInt(firstGroup.value * 100 + year.value);
        j = year.end;
        ordinal = this.tokens[j - 1].ordinal;
      }
    }

    // Decimals: "three point one four", "point five" (no whole part needed),
    // then optionally one scale word: "two point five million".
    // A bare "point five" only counts when it is the whole selection, so
    // "at this point one should" in running text is left alone.
    const pointOK = groups === 0 ? wholeSelection && j === i : this.joins(j);
    if (!ordinal && this.word(j) === "point" && pointOK) {
      let k = j + 1;
      while (this.joins(k) && DIGITS[this.word(k)] !== undefined && !this.tokens[k].ordinal) {
        frac += DIGITS[this.word(k)];
        k += 1;
      }
      if (frac) {
        j = k;
        const exp = SCALES[this.word(j)];
        if (!usedScale && exp && this.joins(j) && !this.tokens[j].ordinal) {
          const shifted = scaleDecimal(total.toString(), frac, exp);
          total = BigInt(shifted.int);
          frac = shifted.frac;
          j += 1;
        }
      }
    }
    if (groups === 0 && !frac) return null;

    const result = { int: total, frac, sign, ordinal, currency: null, minor: null, percent: false, start, end: j };
    if (!ordinal) this.readUnits(result);
    return result;
  }

  // Skips an "and" between groups: "one thousand and five".
  afterAnd(j) {
    return this.word(j) === "and" && this.joins(j, this.isScale(j - 1)) ? j + 1 : j;
  }

  // Whether token i is a scale word such as "thousand".
  isScale(i) {
    return Boolean(this.tokens[i] && SCALES[this.tokens[i].word]);
  }

  // The second half of a year said in pairs: 10 to 99, or "oh" and a digit.
  readYearEnd(j) {
    if ((this.word(j) === "oh" || this.word(j) === "o") && this.joins(j + 1)) {
      const d = UNITS[this.word(j + 1)];
      if (d >= 1 && d <= 9) return { value: d, end: j + 2 };
      return null;
    }
    const s = this.readSmall(j);
    return s && s.value >= 10 && this.word(s.end) !== "hundred" && !SCALES[this.word(s.end)] ? s : null;
  }

  // Currency and percentage words after the number: "pounds", "pounds and
  // fifty pence", "pounds fifty", "pence", "per cent". Updates the result.
  readUnits(r) {
    let j = r.end;
    const w = this.word(j);
    if (!this.joins(j)) return;
    if (MAJOR[w]) {
      r.currency = MAJOR[w];
      j += 1;
      // Pence or cents after the pounds: "and fifty pence", "fifty"
      if (!r.frac) {
        const at = this.word(j) === "and" && this.joins(j) ? j + 1 : j;
        const small = this.joins(at) && this.readSmall(at);
        if (small && small.value > 0 && !this.tokens[small.end - 1].ordinal) {
          const unit = this.word(small.end);
          if (MINOR[unit] && unit !== "p" && this.joins(small.end)) {
            r.frac = String(small.value).padStart(2, "0");
            j = small.end + 1;
          } else if (!MAJOR[unit] && !(at > j)) {
            // "five pounds fifty", but not "five pounds and fifty people"
            r.frac = String(small.value).padStart(2, "0");
            j = small.end;
          }
        }
      }
    } else if (MINOR[w] && !r.frac) {
      r.minor = MINOR[w];
      j += 1;
    } else if (w === "per" && this.word(j + 1) === "cent" && this.joins(j + 1)) {
      r.percent = true;
      j += 2;
    } else if (w === "percent") {
      r.percent = true;
      j += 1;
    }
    r.end = j;
  }
}

// Multiplies a decimal (int and fraction digit strings) by 10^exp exactly:
// ("2", "5", 6) → { int: "2500000", frac: "" }.
function scaleDecimal(int, frac, exp) {
  const digits = int + frac.padEnd(exp, "0");
  const point = int.length + exp;
  return {
    int: digits.slice(0, point).replace(/^0+(?=\d)/, ""),
    frac: digits.slice(point).replace(/0+$/, ""),
  };
}

// ---------------------------------------------------------------------------
// Writing the digits
// ---------------------------------------------------------------------------

// Puts a thousands separator between each group of three digits.
function group(digits, sep) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

// "1" → "1st", "12" → "12th", "22" → "22nd".
function ordinalSuffix(digits) {
  const n = Number(digits.slice(-2));
  if (n >= 11 && n <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
}

// Rounds a decimal to two places for money, carrying into the whole part:
// ("4", "999") → ["5", "00"].
function roundToPence(int, frac) {
  const f = (frac + "000").slice(0, 3);
  let pence = Number(f.slice(0, 2)) + (Number(f[2]) >= 5 ? 1 : 0);
  if (pence === 100) {
    pence = 0;
    int = (BigInt(int) + 1n).toString();
  }
  return [int, String(pence).padStart(2, "0")];
}

// Formats what readNumber found. style.grouping is "auto" (separators from
// 10,000 and in money, so years and four-digit numbers stay as 2005),
// "always" or "never"; style.decimalComma swaps the full stop and comma.
function format(r, style) {
  const dec = style.decimalComma ? "," : ".";
  const sep = style.decimalComma ? "." : ",";
  let int = r.int.toString();
  let frac = r.frac;
  const money = Boolean(r.currency || r.minor);
  const useSep = style.grouping === "always" ||
    (style.grouping !== "never" && (money || int.length > 4));
  const g = (digits) => (useSep ? group(digits, sep) : digits);

  // 150 pence reads better as £1.50
  if (r.minor === "£" && int.length > 2 && !frac) {
    return r.sign + "£" + g(int.slice(0, -2)) + dec + int.slice(-2);
  }
  if (r.minor === "£") return r.sign + g(int) + (frac ? dec + frac : "") + "p";
  if (r.minor === "¢") return r.sign + g(int) + (frac ? dec + frac : "") + "¢";
  if (r.currency) {
    if (frac) [int, frac] = roundToPence(int, frac);
    return r.sign + r.currency + g(int) + (frac ? dec + frac : "");
  }
  let out = r.sign + g(int) + (frac ? dec + frac : "");
  if (r.ordinal) out += ordinalSuffix(int);
  if (r.percent) out += "%";
  return out;
}

// ---------------------------------------------------------------------------
// Converting a selection
// ---------------------------------------------------------------------------

// Whether a number found in running text should be converted: anything worth
// ten or more, and any decimal, amount or percentage. One to nine stay as
// words, so "one of them" and "wait a second" are left alone.
function worthConverting(r) {
  return r.int >= 10n || Boolean(r.frac || r.currency || r.minor || r.percent);
}

// Converts the selection. If the whole selection is one number it becomes
// just its digits, whatever its size; otherwise each number phrase worth ten
// or more is replaced in place. Returns null if nothing was converted.
function convertText(text, style) {
  const tokens = tokenise(text);
  const reader = new Reader(text, tokens);

  // The whole selection is a single number, perhaps with a full stop after it
  const whole = tokens.length ? reader.readNumber(0, true) : null;
  const after = tokens.length ? text.slice(tokens[tokens.length - 1].end) : "";
  if (whole && whole.end === tokens.length &&
      /^\s*$/.test(text.slice(0, tokens[0].start)) && /^[\s.!?]*$/.test(after)) {
    return format(whole, style) + after.trim();
  }

  let out = "";
  let last = 0;
  let count = 0;
  for (let i = 0; i < tokens.length; i++) {
    // Only start a number at the beginning of a phrase, not in the middle of
    // one already rejected ("hundred" on its own, "five" in "twenty-five")
    if (i > 0 && reader.joins(i) && reader.readSmall(i - 1)) continue;
    const r = reader.readNumber(i);
    if (!r || !worthConverting(r)) continue;
    // Keep any minus sign typed in figures: "-twenty" is left alone
    out += text.slice(last, tokens[i].start) + format(r, style);
    last = tokens[r.end - 1].end;
    count += 1;
    i = r.end - 1;
  }
  return count ? out + text.slice(last) : null;
}

// ---------------------------------------------------------------------------
// When the button appears
// ---------------------------------------------------------------------------

// The button only appears when there is something worth converting, so it
// doesn't clutter the PopClip bar for every sentence with "one" in it:
//   - a word for ten or more ("eleven", "forty", "hundred", "thousand", "twentieth"),
//   - a small number with a decimal point, currency or "per cent" after it,
//   - or a selection that is nothing but a small number ("seven", "first").
const SMALL = "zero|nought|one|two|three|four|five|six|seven|eight|nine";
const VISIBLE = new RegExp([
  String.raw`\b(?:(?:ten|eleven|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundred|thousand|[a-z]*illion)(?:th)?|twelve|twelfth|(?:twent|thirt|fort|fift|sixt|sevent|eight|ninet)(?:y|ieth))\b`,
  String.raw`\b(?:${SMALL})[\s-]+(?:point|pounds?|pence|penny|p|quid|dollars?|euros?|cents?|per\s+cent|percent)\b`,
  String.raw`^\s*(?:(?:minus|negative)\s+)?(?:${SMALL}|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)[\s.]*$`,
  String.raw`^\s*point\s+(?:${SMALL}|oh)\b`,
].join("|"), "i");

// ---------------------------------------------------------------------------
// PopClip action
// ---------------------------------------------------------------------------

// Converts the selection and delivers it the same way as Number to Words:
// ⌥-click always replaces the selection, ⇧-click always shows the result,
// and a plain click does whatever the "Plain click" option says.
function run(input, options) {
  // Older PopClip versions have no localeInfo, so fall back to a full stop
  const locale = typeof util !== "undefined" && util.localeInfo ? util.localeInfo.decimalSeparator : ".";
  const mark = options.decimal === "auto" ? locale : options.decimal;
  const result = convertText(input.text, {
    grouping: options.grouping,
    decimalComma: mark === "comma" || mark === ",",
  });
  if (result === null) {
    popclip.showText("No number words found");
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

exports.action = {
  regex: VISIBLE,
  code: run,
};

// Extra exports for the test script; PopClip itself has no "process" object
if (typeof process !== "undefined") {
  Object.assign(exports, { convertText, tokenise, Reader, format, VISIBLE });
}
