---
title: URI
description: Open a comment or run an action from a link.
sidebar:
  order: 3
---

Hypomnema answers `obsidian://hypomnema` links. They work from any app that opens links: a browser, a task manager, a launcher, another note.

## Back-link to a comment

Each extracted comment ends with a ↩ link of this form:

```text
obsidian://hypomnema?vault=<vault>&file=<path>&id=a1
```

It opens the note `file` in the vault `vault` and selects the passage of comment `id`. Values are URL-encoded. This link also identifies the comment in an extraction note: re-extracting with *Add only new comments* skips a comment whose link is already there.

## Running an action

:::note
Available from version 0.5.0.
:::

```text
obsidian://hypomnema?run=<id>&<variable>=<value>
```

This runs the [action](/concepts/actions/) with id `<id>`. The parameter is `run`, not `action`, because Obsidian reserves `action` in its links. Any other parameter prefills the `{{VALUE:…}}` prompt of the same name, so the action does not ask for it:

```text
obsidian://hypomnema?run=k3f9&project=Thesis
```

runs action `k3f9` with `{{VALUE:project}}` set to `Thesis`.
