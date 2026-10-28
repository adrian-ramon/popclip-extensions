#!/bin/zsh
#
# Character Map — PopClip extension
# Author:  Adrian Ramon
# Version: 1.0 (24 October 2026)
# Licence: MIT (see LICENSE in the repository root)
#
# Builds a one-off character map page for the selected text, opens it, then
# deletes it. The page is ctim-head.html, then the selection as a JSON string,
# then ctim-tail.html.

# Find the extension folder (where this script lives), falling back to the
# working directory, which is where PopClip runs extension scripts
dir=${0:A:h}
[[ -f "$dir/ctim-head.html" ]] || dir=$PWD
# Make a private temporary file with an .html name, so the browser opens it
page=$(mktemp "${TMPDIR:-/tmp}/character-map.XXXXXX") || exit 1
mv "$page" "$page.html" && page="$page.html"
# JSON-encode via JavaScript for Automation; escape "<" so the text can't close the script tag
json=$(/usr/bin/osascript -l JavaScript -e 'ObjC.import("stdlib"); JSON.stringify($.getenv("POPCLIP_TEXT")).replace(/</g, "\\u003c")') || exit 1
# Assemble the page and open it in the default browser
{ cat "$dir/ctim-head.html"; print -r -- "$json"; cat "$dir/ctim-tail.html"; } > "$page"
open "$page"
# Give the browser time to load it, then remove it so the text doesn't linger on disk
( sleep 30; rm -f "$page" ) > /dev/null 2>&1 &!
