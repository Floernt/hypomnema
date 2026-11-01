---
title: Storage format
description: How comments are written inside the note, for scripts and for readers without the plugin.
sidebar:
  order: 1
---

Comments are plain text inside the note. They remain readable without the plugin, and any script can read them. The format is a promise: notes written with an older version keep working, and every change to it is backward compatible and recorded in the [changelog](https://github.com/Floernt/hypomnema/blob/main/CHANGELOG.md).

## Markers in the text

A commented passage is wrapped in two Obsidian comments that share an id. A comment placed at the cursor is an empty anchor:

```text
The author argues that %%[a1%%memory is a reconstruction%%a1]%% rather than a recording.
A comment placed here %%[a2%%%%a2]%% without a selection.
```

## The annotations block

The comment texts live in a single block at the end of the note:

```text
%% annotations
[a1] 2026-10-31 #idea First comment
    continued (indented continuation lines)
  [a1.1] 2026-11-04 Reply to comment a1
[a2] 2026-10-31 Comment without a category
%%
```

A root comment has the id `aN`; its replies are `aN.k`, indented by two spaces. Each entry starts with `[id] YYYY-MM-DD`. An optional `#tag` (the category, root comments only) can follow, then the text. Indented lines that follow continue the entry. An uncategorised text that starts with `#` is written as `\#…`.

`%%` is hidden in reading view, so the note stays clean without the plugin.

## For scripts

The regular expression for a commented passage is `%%\[(a\d+)%%([\s\S]*?)%%\1\]%%`. For a cursor comment, group 2 is empty.

A comment whose markers were deleted stays in the block. The panel flags it as orphaned.

To write comments from a script, prefer the [API](/advanced/api/) to editing the text by hand: it keeps tags and events in step.

## Automatic tags

When a comment gets a category, its tag is added to the note's `tags` property. The tag is removed when no comment of that category remains, unless the note already had that tag before. The plugin keeps track of the tags it added in its `data.json`.
