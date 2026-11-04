---
title: Scripts
description: JavaScript with Hypomnema, through QuickAdd or Templater user scripts.
sidebar:
  order: 4
---

:::note
Hypomnema no longer runs JavaScript itself. The *Script* step of chains, added in 0.5.0, was removed in 0.6.0: Obsidian's directory review discourages a plugin from executing code. Scripts now go through [QuickAdd](/integrations/quickadd/) or [Templater](/integrations/templater/), which are built for it and call Hypomnema through its [public API](/advanced/api/).
:::

:::danger[A script has the same rights as a plugin]
A script can read, change and delete any file of your vault, and reach the network. Only run scripts you wrote yourself or have read and understood.
:::

## With QuickAdd

A QuickAdd user script is a `.js` file of your vault, added as a step of a QuickAdd macro:

```js
module.exports = async (params) => {
  const { app, variables } = params;
  const api = app.plugins.plugins.hypomnema?.api;
  if (!api) throw new Error("Hypomnema is not enabled");
  // …
};
```

From the script, the API reads comments (`api.threads`, `api.allThreads`), adds them (`api.addComment`, `api.reply`) and runs a Hypomnema action with `api.runAction(id, vars)`. The values in `vars` answer the action's `{{VALUE:…}}` prompts, which then are not asked. A QuickAdd macro can thus do what a chain with a script used to do: its steps call Hypomnema's commands, and its scripts pass values to it.

## Example

```js
// Scripts/count.js — shows the number of comments in the active note
module.exports = async ({ app }) => {
  const api = app.plugins.plugins.hypomnema?.api;
  const file = app.workspace.getActiveFile();
  if (!api || !file) throw new Error("Hypomnema disabled or no active note");
  const threads = await api.threads(file);
  new Notice(`${threads.length} comment(s)`);
};
```

A fuller example is in the method note [End of reading](/method/end-of-reading/).

## Moving a script written for 0.5

Scripts written for 0.5 already had the QuickAdd user script signature. To move one:

1. Replace `params.api` with `params.app.plugins.plugins.hypomnema.api`, and `params.obsidian.Notice` (or anything else from the module) with `Notice`, which QuickAdd makes available.
2. Step settings (`settings`) no longer exist: write the values at the top of the script, or ask for them with `params.quickAddApi.inputPrompt`.
3. In a QuickAdd macro, `params.variables` is shared between steps, as the chain's was.
4. Delete the *Script (removed)* step from the Hypomnema chain. It stays visible in the editor for that purpose, but no longer runs.
