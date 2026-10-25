# Number to Words

Spell out numbers and currency amounts in British English words, on their own or inside a sentence.

Select a number such as `£87,136,582,468.766` and click the button to get:

> Eighty-seven billion, one hundred and thirty-six million, five hundred and eighty-two thousand, four hundred and sixty-eight pounds and seventy-seven pence

## What it understands

- Numbers inside longer text: "Total due: £1,234.50 by Friday" becomes "Total due: one thousand, two hundred and thirty-four pounds and fifty pence by Friday"
- Percentages: `15%` becomes "fifteen per cent"
- Plain numbers, with or without thousands separators: `1005`, `1,200`, `12.345`
- Amounts in pounds, dollars and euros, by symbol or code: `£5`, `$3.50`, `€1,000,000`, `100 GBP`
- Negative numbers: `-£12.30`, `£-5`
- Numbers up to centillion (10^303)

Currency amounts are rounded to the nearest penny or cent. Plain decimals are read digit by digit ("twelve point three four five"). European-style separators such as `1.234,56` are not supported. Dates, times, ranges, version numbers and codes such as `A123` are left alone.

## Options

- **Plain click:** copy the result to the clipboard (default), replace the selection, or show it in PopClip.
- **⌥-click** always replaces the selection, and **⇧-click** always shows the result.
- **Capitalise first letter:** on by default.

## Privacy

Everything runs locally inside PopClip. No data is sent anywhere.

## Author

Adrian Ramon. Based on the number formatter in TextFormatter.

## Changelog

- 1.0 (24 October 2026): first release.
