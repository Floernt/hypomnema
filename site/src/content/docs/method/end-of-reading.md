---
title: End of reading
description: A QuickAdd macro that extracts the comments, logs the reading and marks the note as read.
sidebar:
  order: 6
---

:::note
Available from version 0.5.0. Since 0.6.0, the script goes through a [QuickAdd](/integrations/quickadd/) macro: Hypomnema no longer runs JavaScript itself (see [Scripts](/advanced/scripts/)).
:::

:::caution[Draft — the author will rewrite this section]
“The idea” and “An example from a real reading” are a draft.
:::

## The idea

Finishing a reading is a moment worth marking. Without a ritual, the article is closed and joins the pile of things read once. With one, the end of reading becomes a short sequence: gather what you wrote, note that you read it, and set the next step. A single command does the mechanical part, so the attention goes to deciding what the reading was worth.

## An example from a real reading

The last paragraph of *Why we forget what we read* is read. One hotkey runs *End of reading*: the comments are extracted, a line "2026-11-01 [[Why we forget what we read]]" is added to `Reading log.md`, and the script sets the property `status: read` on the note. The extraction note opens, ready for the [periodic review](/method/periodic-review/).

## The setting

First, the QuickAdd user script `Scripts/mark-read.js`:

```js
const PROPERTY = "status";
const VALUE = "read";
const LOG = "Reading log.md";

module.exports = async ({ app }) => {
  const file = app.workspace.getActiveFile();
  if (!file) throw new Error("No active note");
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm[PROPERTY] = VALUE;
  });
  const log = app.vault.getAbstractFileByPath(LOG);
  const line = `- ${window.moment().format("YYYY-MM-DD")} [[${file.basename}]]\n`;
  if (log) await app.vault.append(log, line);
  else await app.vault.create(LOG, line);
};
```

Then, in QuickAdd, a *Macro* choice named *End of reading*, with its command on (the lightning icon):

| Step | QuickAdd type | Value |
|---|---|---|
| 1 | *Obsidian command* | **Hypomnema: Extract comments from this note** (`hypomnema:extract-note`) |
| 2 | *User script* | `Scripts/mark-read.js` |

If a step fails, QuickAdd stops the macro and shows the error. See [Scripts](/advanced/scripts/) for the security warning.

## Variants

**Without a script.** Replace step 2 with a QuickAdd *Capture* to the reading log, as in the [QuickAdd](/integrations/quickadd/) recipe.

**Passing values to Hypomnema.** A script of the macro can run a Hypomnema action and answer its `{{VALUE:…}}` prompts: `api.runAction("<id>", { verdict: "to reread" })`. The action then does not ask. `params.variables` shares values between the macro's steps.

**Wait for the view.** If a step opens a note that the next step needs, add a QuickAdd *Wait* step of 300 ms between them.
