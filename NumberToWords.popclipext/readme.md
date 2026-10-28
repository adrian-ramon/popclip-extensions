# Number to Words

Spell out numbers and currency amounts in British English words, on their own or inside a sentence.

Select a number such as `£87,136,582,468.766` and click the button to get:

> Eighty-seven billion, one hundred and thirty-six million, five hundred and eighty-two thousand, four hundred and sixty-eight pounds and seventy-seven pence

## What it understands

- Numbers inside longer text: "Total due: £1,234.50 by Friday" becomes "Total due: one thousand, two hundred and thirty-four pounds and fifty pence by Friday"
- Percentages: `15%` becomes "fifteen per cent"
- Plain numbers, with or without thousands separators: `1005`, `1,200`, `12.345`
- Thousands grouped the way different countries write them: `12,345,678`, `12.345.678`, `12 345 678`, `12'345'678` and Indian-style `1,23,45,678`
- European decimals such as `€1.234,56` or `12 345,67`
- Amounts in pounds, dollars and euros, by symbol or code: `£5`, `$3.50`, `€1,000,000`, `100 GBP`
- Negative numbers: `-£12.30`, `£-5`
- Numbers up to centillion (10^303)

Currency amounts are rounded to the nearest penny or cent. Plain decimals are read digit by digit ("twelve point three four five"). When a number could be read either way, such as `1.234`, the **Decimal separator** option decides, and by default it follows your Mac's region settings: with a full stop it is one point two three four, with comma it is one thousand, two hundred and thirty-four. Inside longer text, numbers grouped with plain spaces (or with repeated full stops, unless you use comma decimals) are only recognised when you select the number on its own, so lists, phone numbers and IP addresses aren't mangled. Dates, times, ranges, version numbers and codes such as `A123` are left alone.

## Options

- **Plain click:** copy the result to the clipboard (default), replace the selection, or show it in PopClip.
- **⌥-click** always replaces the selection, and **⇧-click** always shows the result.
- **Decimal separator:** same as your Mac (default), full stop (1,234.56) or comma (1.234,56).
- **Capitalise first letter:** on by default.

## Privacy

Everything runs locally inside PopClip. No data is sent anywhere.

## Author

Adrian Ramon.

## Changelog

- 1.1 (28 October 2026): fixed numbers with comma separators such as 12,345,678 not being recognised; added other countries' grouping styles and a decimal separator option that follows your Mac by default; phone numbers and codes with leading zeros inside text are left alone.
- 1.0 (24 October 2026): first release.
