# Words to Numbers

Turn numbers written in words into digits, on their own or inside a sentence. It is the reverse of [Number to Words](../NumberToWords.popclipext/).

Select `two thousand and five` and click the button to get `2005`.

## What it understands

- British and American styles, with or without "and" and hyphens: `three hundred and sixty-five`, `one hundred five`, `forty two`
- "A" for one: `a hundred and fifty` → 150, `a thousand` → 1000
- Hundreds above a thousand: `twenty-five hundred` → 2500, `eleven hundred and one` → 1101
- Years said in pairs: `nineteen sixty-nine` → 1969, `twenty twenty-six` → 2026, `nineteen oh five` → 1905
- Commas between groups, as Number to Words writes them: `one thousand, two hundred and thirty-four` → 1234
- Decimals: `three point one four` → 3.14, `two point five million` → 2,500,000
- Money: `twelve pounds and thirty pence` → £12.30, `five pounds fifty` → £5.50, `twenty quid` → £20, `fifty pence` → 50p, `ten thousand dollars` → $10,000, `five euros` → €5
- Percentages: `fifteen per cent` → 15%
- Ordinals: `twenty-first` → 21st, `one hundredth` → 100th
- Negative numbers: `minus forty-two` → -42
- The older British `a thousand million` → 1,000,000,000, and every scale up to centillion (10^303)

## Numbers inside a sentence

If the whole selection is one number, it becomes just its digits, whatever its size. In longer text, number phrases worth ten or more are converted and one to nine are left as words, as most British style guides recommend. Decimals, money and percentages are always converted.

> He sold a hundred and fifty copies in nineteen ninety-nine, one of his best years.

becomes

> He sold 150 copies in 1999, one of his best years.

This also keeps phrases like "one of them", "wait a second" and "at this point one should" safe. Words on separate lines are never joined into one number, so lists stay as they are.

## Options

- **Plain click:** replace the selection with digits (default), copy them to the clipboard, or show them in PopClip.
- **⌥-click** always replaces the selection, and **⇧-click** always shows the result.
- **Thousands separator:** by default, separators are added from 10,000 upwards and in money, so years and four-digit numbers stay as `2005` but `12,500` and `£1,500` are grouped. You can also choose always or never.
- **Decimal separator:** same as your Mac (default), full stop (1,234.56) or comma (1.234,56).

## Limits

Fractions such as "two and a half" and "a dozen" are not converted, and idioms are taken literally: "one in a million" becomes "one in 1,000,000". Select just the part you want converted if a sentence contains numbers you'd rather keep as words.

## Privacy

Everything runs locally inside PopClip. No data is sent anywhere.

## Author

Adrian Ramon.

## Changelog

- 1.0 (31 October 2026): first release.
