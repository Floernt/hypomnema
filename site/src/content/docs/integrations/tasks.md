---
title: Tasks
description: Treat extracted comments as tasks with the Tasks plugin.
sidebar:
  order: 5
---

The [Tasks](https://publish.obsidian.md/tasks/) plugin is not required. Extracted comments are written as `- [ ]` items in the list and Kanban formats, which Tasks recognises as ordinary tasks.

## What it brings

Tasks gathers open items from the whole vault, with due dates, priorities and recurring tasks. Comments that call for an action, such as a source to check or a note to write, then sit in the same list as the rest of your work.

## Minimal recipe: open comments from extraction notes

If your extraction notes go to a dedicated folder (for instance `Extractions`, set in *Settings → Hypomnema → Extraction → Folder*), this query lists every comment not yet ticked:

````markdown
```tasks
not done
path includes Extractions
group by filename
```
````

Ticking a task in the query ticks it in the extraction note. On a Kanban board, the card is ticked too.

## Variant: a due date in the line template

:::note
Available from version 0.5.0.
:::

The line template of an [Extraction](/concepts/extraction/) can add Tasks fields. Relative dates are counted from today, so this gives every extracted comment a due date one week after the extraction:

```text
{{text}} — “{{quote}}” {{link}} 📅 {{date+7d}}
```

Combined with a filter on a single category, such as `to-verify`, it turns a reading into a dated verification list.
