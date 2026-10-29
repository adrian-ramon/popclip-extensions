# Clean Spaces

Tidies the spacing in text copied from web pages, PDFs, emails and Word documents, with one click.

Select `Dear  John ,` and click **Clean Spaces** to get `Dear John,`.

## What it fixes

| Problem | Before | After |
|---|---|---|
| Double spaces and tabs inside a line | `the  quick` (two spaces), a tab between words | `the quick`, one space |
| Spaces at the start and end of lines | `  indented line  ` | `indented line` |
| Non-breaking and other look-alike spaces | `10 km` typed with a no-break space | `10 km` with a normal space |
| Invisible characters | zero-width spaces, word joiners, byte order marks, soft hyphens | removed |
| Runs of blank lines | three blank lines | one blank line |
| Spaces before punctuation | `Really ?`, `word , word`, `( see below )` | `Really?`, `word, word`, `(see below)` |
| Mixed line breaks | Unicode line separators from some web pages | normal line breaks |

## What it leaves alone

Some unusual spaces are there on purpose, so they are kept:

- **Thousands separators.** A no-break or thin space between digits, as in `1 234 567` (the style Number Formatter can produce), stays as it is.
- **Chinese, Japanese and Korean.** Full-width spaces next to those characters are normal there.
- **Thai, Lao, Khmer and Burmese.** These languages don't put spaces between words, and use a zero-width space to show where a line may break.
- **Emoji.** Zero-width joiners hold emoji such as 👨‍👩‍👧 together, so they are never removed.
- **Line endings.** Windows line endings stay Windows line endings, and a selection that ends with a line break (as when you triple-click a paragraph) still ends with one, so it doesn't join the next paragraph.

Spaces before punctuation are only removed when the punctuation is followed by a space or the end of the line, so emoticons such as `:)` and spaced ellipses (`. . .`) aren't touched. If the selection looks like code (it has `=`, `{ }`, `< >`, `&&` or `||`), spacing around punctuation is left alone, so `a ? b : c` stays readable.

To keep the PopClip bar tidy, the button only appears when the selection has something to clean.

## Things to know

- Spaces at the start and end of the selection are removed. If you select part of a sentence including the spaces either side, the words may join up with the text around it.
- Indentation is removed by default. Turn on **Keep indentation** for code or indented lists.
- In Markdown, two spaces at the end of a line mean a line break. Clean Spaces removes them.
- With **Blank lines** set to **Remove all**, the button doesn't appear for text whose only problem is single blank lines between paragraphs.
- French typography puts a space before `! ? ; :`. Turn off **Remove spaces before punctuation** if you write French.

## Options

- **Blank lines:** at most one in a row (default), remove all, or leave as they are.
- **Remove spaces before punctuation:** on by default.
- **Keep indentation at the start of lines:** off by default.
- **Plain click:** replace the selection (default), copy the result, or show it in PopClip.
- **⌥-click** always replaces the selection, and **⇧-click** always shows the result, as in the other extensions in this set.

## Privacy

Everything runs locally inside PopClip. No data is sent anywhere.

## Author

Adrian Ramon.

## Changelog

- 1.0 (29 October 2026): first release.
