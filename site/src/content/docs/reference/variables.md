---
title: Variables
description: Every variable of the {{…}} syntax, with where it applies.
sidebar:
  order: 1
---

The concepts behind this table are explained on the [Variables](/concepts/variables/) page. An unknown variable is left as is.

## Available now

| Variable | Where | Value |
|---|---|---|
| `{{text}}` | Line template | Text of the comment |
| `{{quote}}` | Line template | Commented passage, or the context around a point comment |
| `{{tag}}` | Line template | Category tag |
| `{{category}}` | Line template | Category name |
| `{{date}}` | Line template | Date of the comment |
| `{{date}}` | Note name | Today's date |
| `{{note}}` | Line template | Link to the source note |
| `{{note}}` | Note name | Name of the note or folder |
| `{{link}}` | Line template | ↩ back-link to the passage |
| `{{id}}` | Line template | Id of the comment (`a1`) |

## From version 0.5.0

| Variable | Where | Value |
|---|---|---|
| `{{date:FORMAT}}` | Everywhere | `{{date}}` in a [Moment.js format](https://momentjs.com/docs/#/displaying/format/); date of the comment in the line template, today elsewhere |
| `{{today}}` | Everywhere | Today's date (YYYY-MM-DD) |
| `{{today:FORMAT}}` | Everywhere | Today's date in a Moment.js format |
| `{{date-7d}}`, `{{date+1d}}` | Everywhere | Today minus or plus N days |
| `{{note}}` | Template, annotation | Name of the note or folder |
| `{{selection}}` | Annotation, template | Selected text |
| `{{cursor}}` | Annotation | Where the cursor is placed in the starting text |
| `{{sources}}` | Template | Links to the source notes |
| `{{comments}}` | Template | Body of the extraction |
| `{{VALUE:label}}` | Everywhere | Value typed in a prompt titled *label*; same label, same value within a gesture or chain |
| `{{GLOBAL:name}}` | Everywhere | Value of the [global variable](/concepts/variables/#global-variables) *name* |

Date offsets are always counted from today, even in the line template.
