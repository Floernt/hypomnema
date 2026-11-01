---
title: Template
description: A note of your vault used as the skeleton of an extraction note.
sidebar:
  order: 5
---

:::note
Available from version 0.5.0.
:::

A template is an ordinary note of your vault, for instance `Templates/Reading review.md`, that an [Extraction](/concepts/extraction/) uses as the skeleton of the note it creates. You give its path in the *Template note* field (the `.md` extension is optional). It contains free text and [variables](/concepts/variables/), including two that only templates know:

- `{{comments}}` is the body of the extraction: the comments, in the chosen format;
- `{{sources}}` is a list of links to the source notes.

```markdown
---
status: draft
tags:
  - review
---
# Review of {{note}}, {{today}}

Sources: {{sources}}

{{comments}}

## What I take from it

```

## Rules

A template applies to the list and table formats. The Kanban format ignores it, and the form says so: the structure the Kanban plugin expects is too strict to mix with free text.

When the extraction adds only new comments (*Add only new comments*), the template is used once, when the note is created. Later runs write the new comments into the existing note, between the markers described below.

The template's properties are kept. Hypomnema adds `hypomnema-extract`, `hypomnema-source` and `hypomnema-date`, and merges its tags with the template's, without duplicates.

## Markers

`{{comments}}` is rendered between two invisible Obsidian comments:

```markdown
%% hypomnema:start %%
…comments…
%% hypomnema:end %%
```

Later runs in *Add only new comments* mode write only between these two markers, so the text you write after the block (here, *What I take from it*) stays where it is. If you delete the markers, new comments are added at the end of the note. These markers belong to the extraction note only; they do not touch the [storage format](/advanced/storage-format/) of comments.

The method note [From reading to writing](/method/reading-to-writing/) uses a template as the first draft of a note.
