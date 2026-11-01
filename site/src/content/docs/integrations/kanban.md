---
title: Kanban
description: Review your comments on a Kanban board, one column per category.
sidebar:
  order: 2
---

The [Kanban](https://github.com/mgmeyers/obsidian-kanban) plugin is not required: without it, a Kanban extraction is still a readable Markdown note of headings and tasks. With it, the note opens as a board.

## What it brings

A board turns the extraction into a review. Each comment is a card you move once you have dealt with it: written the note, checked the source, answered the question. The ↩ link on each card leads back to the passage.

## Minimal recipe: a review board per reading

Set *Format* to *Kanban board* in *Settings → Hypomnema → Extraction*. Run *Extract comments from this note*. Each category becomes a column, plus an empty *Done* column.

![Extracting from the command palette: a Kanban board opens](/screenshots/10-extract-en.gif)

Move a card to *Done* once you have dealt with the comment. Extracting again later only adds the comments written since, in their category's column; the cards you moved stay where they are.

![A Kanban board of extracted comments](/screenshots/10-extract-kanban-en.png)

## Variant: a weekly board across the vault

:::note
Available from version 0.5.0.
:::

An [Extraction](/concepts/extraction/) action with scope *Whole vault*, *Active since* set to `{{date-7d}}` and the Kanban format collects the week's comments from every note on one board. The method note [Periodic review](/method/periodic-review/) gives the full setting.

A [template](/concepts/template/) does not apply to the Kanban format: the structure the Kanban plugin expects is too strict to mix with free text.
