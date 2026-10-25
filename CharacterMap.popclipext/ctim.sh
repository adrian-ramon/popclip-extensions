#!/bin/zsh
# Builds a one-off character map page for the selected text, opens it, then deletes it
dir=${0:A:h}
[[ -f "$dir/ctim-head.html" ]] || dir=$PWD
page=$(mktemp "${TMPDIR:-/tmp}/character-map.XXXXXX") || exit 1
mv "$page" "$page.html" && page="$page.html"
# JSON-encode via JavaScript for Automation; escape "<" so the text can't close the script tag
json=$(/usr/bin/osascript -l JavaScript -e 'ObjC.import("stdlib"); JSON.stringify($.getenv("POPCLIP_TEXT")).replace(/</g, "\\u003c")') || exit 1
{ cat "$dir/ctim-head.html"; print -r -- "$json"; cat "$dir/ctim-tail.html"; } > "$page"
open "$page"
# Give the browser time to load it, then remove it so the text doesn't linger on disk
( sleep 30; rm -f "$page" ) > /dev/null 2>&1 &!
