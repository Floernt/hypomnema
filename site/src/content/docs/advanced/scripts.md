---
title: Scripts
description: JavaScript files of your vault run as a step of a chain.
sidebar:
  order: 4
---

:::note
Available from version 0.5.0. Scripts belong to level 3: they only appear when *Advanced features* is on.
:::

:::danger[A script has the same rights as the plugin]
A script can read, change and delete any file of your vault, and reach the network. Only run scripts you wrote yourself or have read and understood.
:::

A script is a `.js` file of your vault, run as a *Script* step of a [chain](/concepts/chain/).

## Signature

```js
module.exports = async (params, settings) => {
  const { app, api, variables, obsidian } = params;
  // …
};
```

`app` is Obsidian's `App`. `api` is Hypomnema's [public API](/advanced/api/). `obsidian` is the Obsidian module, which gives access to `Notice`, `Modal`, `TFile` and the rest without an import. `variables` holds the answers to `{{VALUE:…}}` prompts; it is shared by every step of the chain, so a script can read the values typed earlier and change or add values that the following steps will see.

`settings` holds the key → value pairs set on the script step, so the same file can serve several chains with different settings.

The signature is compatible with QuickAdd's user scripts: the same file can also be used there.

The export can also be an object with an `entry` function:

```js
module.exports = { entry: async (params, settings) => { /* … */ } };
```

## Running

Hypomnema asks for confirmation, naming the file, the first time a script runs, and again whenever the content of the file changes. If the script throws an error, the chain stops and a notice shows the message.

## Example

```js
// Scripts/count.js — shows the number of comments in the active note
module.exports = async ({ app, api, variables, obsidian }, settings) => {
  const file = app.workspace.getActiveFile();
  if (!file) throw new Error("No active note");
  const threads = await api.threads(file);
  variables.count = String(threads.length);
  new obsidian.Notice(`${threads.length} comment(s)`);
};
```

A later step can use `{{VALUE:count}}` without being asked. A fuller example is in the method note [End of reading](/method/end-of-reading/).

## Sharing

[Export](/advanced/export-import/) copies the path of a script, never its code. Whoever imports the action must add the file to their own vault.
