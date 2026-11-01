---
title: Variables
description: The {{…}} syntax shared by every gesture, and global variables.
sidebar:
  order: 6
---

:::note
The per-comment variables of the line template, and `{{note}}` and `{{date}}` in the note name, are available now. The rest of this page is available from version 0.5.0.
:::

Every gesture uses the same syntax: a name between double braces, `{{name}}`, sometimes followed by an argument, `{{name:argument}}`, or by a day offset, `{{date-7d}}`. An unknown variable is left as is. The [variables table](/reference/variables/) lists them all.

## Families

**Per comment**, in the extraction line template: `{{text}}`, `{{quote}}`, `{{tag}}`, `{{category}}`, `{{date}}`, `{{note}}`, `{{link}}`, `{{id}}`.

**Context**: `{{note}}`, `{{selection}}`, `{{cursor}}` (annotation only), `{{sources}}` and `{{comments}}` (templates only).

**Dates**: `{{date}}` (YYYY-MM-DD), `{{date:FORMAT}}` with a [Moment.js format](https://momentjs.com/docs/#/displaying/format/), `{{date-7d}}`, `{{date+1d}}`, and `{{today}}`.

**Input**: `{{VALUE:label}}` opens a prompt titled *label*. The same label keeps the same value throughout the gesture, and in a [chain](/concepts/chain/) it stays available to the following steps.

**Global**: `{{GLOBAL:name}}`, see below.

## Nested contexts: `{{date}}` and `{{note}}`

Two variables already had two meanings before 0.5.0, and they keep them so that existing extractions do not change. The closest context wins.

In the **line template**, which describes one comment, `{{date}}` and `{{date:FORMAT}}` are the date of the comment, and `{{note}}` is a link to the source note.

**Everywhere else** (note name, template, annotation starting text), `{{date}}` is today's date and `{{note}}` is the name of the note or folder.

`{{today}}` and `{{today:FORMAT}}` always mean today's date, whatever the context. `{{date-7d}}` and `{{date+1d}}` are always counted from today. When in doubt, write `{{today}}`.

## Global variables

Global variables are named values that you reuse across gestures. You define them in the *Global variables* section of the settings, as a list of name / value rows:

| Name | Value |
|---|---|
| `reader` | `F. Ernotte` |
| `review-folder` | `Reviews` |
| `review-name` | `Review {{today:YYYY-[W]WW}}` |

You then write `{{GLOBAL:review-folder}}` in the folder of an extraction, or `{{GLOBAL:reader}}` in a template. A value can itself contain variables, like `review-name` above.
