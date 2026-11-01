---
title: Commands
description: Every Hypomnema command, with its id.
sidebar:
  order: 2
---

Hypomnema sets no default hotkey. Assign the ones you want in *Settings → Hotkeys*. A command id can be called from a script with `app.commands.executeCommandById("<id>")`, or from a QuickAdd *Obsidian command* step.

## Available now

| Command | Id |
|---|---|
| Comment on selection or cursor | `hypomnema:comment-selection` |
| Show comments panel | `hypomnema:open-panel` |
| Show or hide comments in the margin | `hypomnema:toggle-margin` |
| Extract comments from this note | `hypomnema:extract-note` |

The folder menu also offers *Extract comments from this folder*, which is not a palette command.

## From version 0.5.0

| Command | Id |
|---|---|
| Run a gesture | `hypomnema:run-geste` |
| One command per gesture with the *Command* toggle on, named after the gesture | `hypomnema:geste-<id>` |

*Run a gesture* opens a searchable list of every gesture; it is available only when at least one gesture exists. *Extract comments from this note* keeps running the default extraction.
