---
title: Periodic review
description: A filtered extraction of the last seven days into a Kanban board.
sidebar:
  order: 4
---

:::note
Available from version 0.5.0.
:::

:::caution[Draft — the author will rewrite this section]
“The idea” and “An example from a real reading” are a draft.
:::

## The idea

A comment is worth something only if you come back to it. Coming back to each reading separately rarely happens; coming back once a week to everything written during the week is a habit that holds. The review gathers the week's comments in one board, where each card is either dealt with, moved on, or dropped.

## An example from a real reading

On Friday, the *Weekly review* action collects the comments of the week across the vault. The *To verify* column holds the Fermat note from *Why we forget what we read*; the source is checked and the card goes to *Done*. The *Question* about point comments stays where it is. An old thread, from a reading three weeks ago, comes back because a reply was added on Tuesday.

## The setting

Create an [Extraction](/concepts/extraction/) action named *Weekly review*:

| Field | Value |
|---|---|
| Scope | Whole vault |
| Categories | empty (all) |
| Active since | `{{date-7d}}` |
| Include replies | on |
| Format | Kanban board |
| Folder | `Reviews` |
| Note name | `Review {{today:YYYY-[W]WW}}` |
| If the note already exists | Add only new comments |

*Active since* keeps a thread whose latest date, root or reply, falls within the last seven days, so a thread revived by a reply comes back. The note name changes each week, so each week gets its own board; running the action twice in the same week only adds the new comments.

## Variants

**A rolling board.** Use a fixed note name, `Review`, and keep a single board that grows; move dealt-with cards to *Done* and archive them with the Kanban plugin.

**One review per category.** Filter on `to-verify` only, for a weekly verification session.

**One review per project.** Set the scope to *A given folder* with the project folder. Or turn on *In the folder menu* (under *More options*) and run it from a right-click on any folder: the clicked folder then overrides the scope.

**With Dataview.** List the review boards with the query in [Dataview](/integrations/dataview/), sorted by `hypomnema-date`.
