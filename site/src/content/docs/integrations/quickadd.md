---
title: QuickAdd
description: Chain Hypomnema's commands with your own QuickAdd macros.
sidebar:
  order: 3
---

[QuickAdd](https://quickadd.obsidian.guide/) is not required. It is useful when you already have macros and want Hypomnema to be one of their steps.

## What it brings

QuickAdd macros chain commands, captures and scripts from any plugin. Every Hypomnema command can be a step, so the end of a reading can feed a log, a project note or a daily note that QuickAdd already manages.

## Minimal recipe: extract at the end of a reading

1. In QuickAdd's settings, create a *Macro* choice, for example "End of reading".
2. Add an *Obsidian command* step: **Hypomnema: Extract comments from this note**.
3. Add the steps you want after it, for instance a *Capture* to a "Reading log" note with the format `- {{DATE}} [[{{LINKCURRENT}}]]`.
4. Enable the macro's command (the lightning icon) to run it from the command palette or a hotkey.

The same command is available to any plugin or script: `app.commands.executeCommandById("hypomnema:extract-note")`.

## Variant: actions and the API in a macro

:::note
Available from version 0.5.0.
:::

Each [action](/concepts/actions/) with the *Command* toggle on is the command `hypomnema:action-<id>`, so it appears in QuickAdd's *Obsidian command* step like any other command.

A [script](/advanced/scripts/) written for a Hypomnema chain also works as a QuickAdd user script. A QuickAdd user script can also call the [public API](/advanced/api/):

```js
module.exports = async (params) => {
  const api = params.app.plugins.plugins.hypomnema?.api;
  if (!api) throw new Error("Hypomnema is not enabled");
  const file = params.app.workspace.getActiveFile();
  const threads = await api.threads(file);
  new Notice(`${threads.length} comment(s) in ${file.basename}`);
};
```

To react to Hypomnema from outside, subscribe to its events, for instance to log every extraction:

```js
app.workspace.on("hypomnema:extracted", (d) => console.log(`${d.added} comment(s) → ${d.file.path}`));
```

The events and their payloads are listed on the [API](/advanced/api/#events) page.
