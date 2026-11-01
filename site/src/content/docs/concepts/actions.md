---
title: Actions
description: An action is a named reading operation that you define and run as an Obsidian command.
sidebar:
  order: 2
---

:::note
Available from version 0.5.0.
:::


![The Actions section of the settings: three actions, each one a command.](/screenshots/12-actions-settings-en.png)

An action is a reading operation you define yourself, give a name to, and run as an Obsidian command. It can be a way of annotating, a way of extracting, or a sequence of both. Without any action defined, the plugin behaves exactly as before: actions are an addition, never a prerequisite.

## The four kinds

| Kind | Level | What it does |
|---|---|---|
| [Annotation](/concepts/annotation/) | 2 | Comments with a preset category and starting text. |
| [Extraction](/concepts/extraction/) | 2 | Extracts comments according to a scope, a filter, a format and a template. |
| [Chain](/concepts/chain/) | 3 | Runs a sequence of steps: actions, commands, scripts, pauses. |
| [Group](/concepts/group/) | 3 | Opens a menu that lists other actions. |

Chains and groups only appear in the settings when *Advanced features* is on. Actions of those kinds that already exist keep running when the switch is off.

## What every action has

```ts
interface ActionBase {
  id: string;        // stable, generated at creation
  name: string;
  kind: "annotation" | "extraction" | "chain" | "group";
  command: boolean;  // exposed as an Obsidian command
}
```

When the *Command* toggle is on, the action becomes the command `hypomnema:action-<id>`. You can then give it a hotkey, find it in the command palette, call it from a QuickAdd macro (*Obsidian command* step) or launch it through the [URI](/advanced/uri/). Adding or deleting an action adds or removes its command at once, without restarting Obsidian.

The command *Run an action* (`hypomnema:run-action`) lists every action in a searchable menu, whether or not it has its own command. It is available as soon as at least one action exists.

## Where are actions stored?

The *Actions* section of *Settings → Hypomnema* lists them with their name, kind and *Command* toggle, and buttons to move, edit or delete each one. *Add an action* opens a short form: a name, a kind, then only the fields that kind needs. Optional fields are folded under *More options*. The *Global variables* section, just below, holds the [global variables](/concepts/variables/#global-variables).

Actions are saved in the plugin's settings, the vault file `.obsidian/plugins/hypomnema/data.json`, not in your notes. To copy them from one vault to another, use [export and import](/advanced/export-import/).
