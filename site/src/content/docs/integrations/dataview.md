---
title: Dataview
description: Query extraction notes and comments with Dataview.
sidebar:
  order: 1
---

[Dataview](https://blacksmithgu.github.io/obsidian-dataview/) is not required. Hypomnema does not try to be a dashboard: it writes plain text, properties and tasks that Dataview already knows how to read. The recipes below assume you have extracted comments at least once (*Extract comments from this note*, or right-click a folder → *Extract comments from this folder*).

## What an extraction note contains

```markdown
---
hypomnema-extract: true
hypomnema-source:
  - "[[Why we forget what we read]]"
hypomnema-date: 2026-10-31
tags:
  - idea
  - to-verify
kanban-plugin: board        # Kanban format only
---

## Idea

- [ ] Comment text — “quoted passage” [↩](obsidian://hypomnema?vault=…&file=…&id=a1)
```

The properties make the note easy to find with `WHERE hypomnema-extract`. The ↩ link reopens the source note and selects the commented passage. It also identifies the comment: when you extract again with *Add only new comments*, a comment whose link is already in the note is skipped, wherever you moved it.

## Minimal recipe: list your extraction notes

````markdown
```dataview
TABLE dateformat(hypomnema-date, "yyyy-MM-dd") AS "Extracted", length(hypomnema-source) AS "Notes", tags AS "Categories"
WHERE hypomnema-extract
SORT hypomnema-date DESC
```
````

![A Dataview dashboard listing extraction notes and every comment in the vault](/screenshots/11-dataview-dashboard-en.png)

## Open items across every board

Kanban cards and list items are ordinary tasks, so Dataview can query them:

````markdown
```dataview
TASK
WHERE hypomnema-extract AND !completed
GROUP BY file.link
```
````

## Variant: every comment in the vault, without extracting

This DataviewJS query reads the `%% annotations` block of each note directly, using the [storage format](/advanced/storage-format/). It requires *Enable JavaScript queries* in Dataview's settings.

````markdown
```dataviewjs
const ENTRY = /^\[(a\d+)\]\s+(\d{4}-\d{2}-\d{2})(?: #([^\s#]+))?(?: (.*))?$/;
const rows = [];
for (const page of dv.pages()) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  const text = await app.vault.cachedRead(file);
  const block = text.match(/^%% annotations[ \t]*\n([\s\S]*?)^%%[ \t]*$/m);
  if (!block) continue;
  for (const line of block[1].split("\n")) {
    const m = ENTRY.exec(line);
    if (m && m[4]) rows.push([page.file.link, m[3] ? "#" + m[3] : "", m[2], m[4]]);
  }
}
rows.sort((a, b) => b[2].localeCompare(a[2]));
dv.table(["Note", "Category", "Date", "Comment"], rows);
```
````

Only the first line of each comment is shown, and replies are left out. A filter in the loop (for instance `if (m[3] !== "to-verify") continue;`) gives a "to verify" list.

## Variant: through the API

:::note
Available from version 0.5.0.
:::

The [public API](/advanced/api/) reads threads for you, replies included, and filters by folder, category and date:

````markdown
```dataviewjs
const api = app.plugins.plugins.hypomnema?.api;
if (!api) { dv.paragraph("Hypomnema is not enabled."); }
else {
  const since = moment().subtract(30, "days").format("YYYY-MM-DD");
  const items = await api.allThreads({ categories: ["to-verify"], since });
  dv.table(["Note", "Date", "Comment", "Replies"],
    items.map(({ file, thread }) =>
      [dv.fileLink(file.path), thread.root.date, thread.root.text, thread.replies.length]));
}
```
````

A `thread` holds the root comment (`thread.root`, with `date`, `tag` and `text`), its `replies` and the commented passage (`thread.quote`). See the [API](/advanced/api/) page.
