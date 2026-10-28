# Superscript

Superscript and subscript anywhere you can type, including plain-text fields, chat apps, forms and file names.

Select `177.97 m3` and click **x²** to get `177.97 m³`. Select `CO2` and click **x₂** to get `CO₂`.

## Two buttons

| Button | What it does | Examples |
|---|---|---|
| **x²** Superscript | Raises powers of units, caret powers and anything else you select | `m3` → `m³`, `km2` → `km²`, `9.81 m/s2` → `9.81 m/s²`, `x^2` → `x²`, `10^-6` → `10⁻⁶`, `2^(n+1)` → `2ⁿ⁺¹` |
| **x₂** Subscript | Lowers the numbers in chemical formulas, underscore indices and anything else you select | `H2O` → `H₂O`, `C6H12O6` → `C₆H₁₂O₆`, `Ca(OH)2` → `Ca(OH)₂`, `x_1` → `x₁` |

## How it decides what to convert

1. **Already converted?** Clicking a button on text that contains its kind of character turns it back to normal, so `H₂O` becomes `H2O` again.
2. **A letter and a number selected on their own**, such as `x2`, become `x²` or `x₂`. Only the number moves.
3. **Units, powers, formulas and indices inside a sentence** are converted, and the rest of the sentence is left exactly as it was.
4. **Anything else** you select is converted as a whole, so `2` becomes `²` and `n` becomes `ⁿ`.

Some things are deliberately left alone: capital-letter names such as the M3 motorway, `v2` in "v2 of the app", product names that look like formulas (PS5, B2B, Y2K, W3C), and counts of 1, so `H1N1` stays as it is.

To keep the PopClip bar tidy, the buttons only appear when there is something to convert: a recognised pattern, text to turn back, a single character, or a short run of numbers and signs. Ordinary words don't bring them up.

## What Unicode can't do

Unicode only has superscript and subscript forms for some characters:

- **Superscript:** all digits, `+ − = ( )`, every lowercase letter except q, and most capitals (not C, F, Q, S, X, Y or Z).
- **Subscript:** all digits, `+ − = ( )`, and only a e h i j k l m n o p r s t u v x. There are no subscript capitals.

If something can't be converted, you get a message naming the characters, rather than half-converted text.

Two more things to know. In some fonts, `¹ ² ³` look slightly different from `⁴` to `⁹`, because they come from an older part of Unicode. And searching for `m3` won't find `m³`, because they are different characters.

This extension doesn't apply Word or Pages-style formatting (a raised baseline). It uses real characters instead, which is what makes it work everywhere.

## Options

- **Plain click:** replace the selection (default), copy the result, or show it in PopClip.
- **⌥-click** always replaces the selection, and **⇧-click** always shows the result, as in Number to Words and Number Formatter.

## Privacy

Everything runs locally inside PopClip. No data is sent anywhere.

## Author

Adrian Ramon.

## Changelog

- 1.0 (28 October 2026): first release.
