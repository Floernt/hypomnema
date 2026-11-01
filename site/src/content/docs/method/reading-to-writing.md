---
title: From reading to writing
description: An extraction template that serves as the first draft of a note.
sidebar:
  order: 5
---

:::note
Available from version 0.5.0.
:::

:::caution[Draft — the author will rewrite this section]
“The idea” and “An example from a real reading” are a draft.
:::

## The idea

Comments written while reading are already the beginnings of a text. What is missing is the passage from scattered remarks to a page that you write. A template gives that page its frame: the comments sit in the middle, and around them the headings you will fill in yourself. The extraction prepares the material; the writing stays yours.

## An example from a real reading

After *Why we forget what we read*, the *Reading note* action creates `Notes/Why we forget what we read — note.md`. The comments appear under *Material*, each with its ↩ link to the passage. Below, the empty sections *What I keep* and *What I contest* wait. The idea on annotation as dialogue becomes the first paragraph; the comment to verify becomes a sentence once the source is checked.

## The setting

Create the template `Templates/Reading note.md`:

```markdown
---
status: draft
---
# {{note}}

Read on {{today}}. Source: {{sources}}

## Material

{{comments}}

## What I keep

## What I contest

```

Then an [Extraction](/concepts/extraction/) action named *Reading note*:

| Field | Value |
|---|---|
| Scope | Current note |
| Format | List by category |
| Template note | `Templates/Reading note` |
| Folder | `Notes` |
| Note name | `{{note}} — note` |
| Line template | `{{text}} — “{{quote}}” {{link}}` |
| If the note already exists | Add only new comments |

The template is used once, when the note is created. If you comment further and run the action again, the new comments are written at the end of *Material*, between the invisible `hypomnema:start` and `hypomnema:end` markers, and your writing below stays untouched. See [Template](/concepts/template/).

## Variants

**Table format.** For a reading with many quotations, the *Table* format lays out passage and comment side by side.

**Quotations only.** Filter on the `quote` category to build a page of quotations ready to cite.

**With Templater.** If Templater is enabled, turn on *Run Templater* under *More options* and add `<% … %>` tags to the template, for instance to ask for the author's name. See [Templater](/integrations/templater/).
