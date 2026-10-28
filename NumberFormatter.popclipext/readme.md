# Number Formatter

Add thousands separators to numbers, in your Mac's number format or any of the common international styles.

Select `12345678.5` and click the button to get `12,345,678.5` (or `12.345.678,5`, `12 345 678,5`, `12’345’678.5`, and so on, depending on the style you choose).

## Styles

| Style | Example |
|---|---|
| Same as my Mac (default) | Follows System Settings › General › Language & Region › Number format |
| UK, US | `1,234,567.89` |
| Germany, Italy | `1.234.567,89` |
| France, Nordics | `1 234 567,89` |
| SI, scientific | `1 234 567.89` |
| Switzerland | `1’234’567.89` |
| India (lakh) | `12,34,567.89` |

Space styles use a thin non-breaking space by default, so a number never splits across two lines. You can switch to a normal non-breaking space or an ordinary space in the options.

## What it understands

- Numbers that are already grouped in any of the styles above, so it also converts between them: `1.234.567,89` becomes `1,234,567.89`.
- Decimals are kept exactly as written, never rounded. Only the decimal mark changes to match the style.
- Signs, currency symbols and units are left in place: `-£1234567.50` becomes `-£1,234,567.50`.
- Numbers inside longer text: "Revenue was 12345678 in 2025" becomes "Revenue was 12,345,678 in 2025".

### How it decides what `1,234` means

A single comma or full stop followed by exactly three digits could be grouping or a decimal. If it already matches the style you chose, it is left alone. Otherwise it is read the way your Mac's number format reads it, so on a UK Mac `1,234` is one thousand two hundred and thirty-four, and `1.234` is one point two three four.

### What it leaves alone inside text

Four-digit numbers on their own (usually years, such as 2025), numbers starting with 0 (phone numbers and codes), dates, times, ranges, version numbers, IP addresses, lists such as `1,2,3`, and anything attached to letters, `#`, `+` or `@`. Select a number on its own to format it regardless.

## Options

- **Number style:** see the table above.
- **Space to use in space styles:** thin non-breaking (default), non-breaking, or ordinary.
- **Leave four-digit numbers as 1234:** follows the SI and many style guides, which group only numbers of five digits or more.
- **Plain click:** replace the selection (default), copy the result, or show it in PopClip.
- **⌥-click** always replaces the selection, and **⇧-click** always shows the result, as in Number to Words.

## Privacy

Everything runs locally inside PopClip. No data is sent anywhere.

## Author

Adrian Ramon.

## Changelog

- 1.0 (28 October 2026): first release.
