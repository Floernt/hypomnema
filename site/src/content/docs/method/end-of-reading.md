---
title: End of reading
description: A chain that extracts, logs the reading and runs a script.
sidebar:
  order: 6
---

:::note
Available from version 0.5.0. This note uses a chain and a script: turn on *Advanced features* in the settings.
:::

:::caution[Draft — the author will rewrite this section]
“The idea” and “An example from a real reading” are a draft.
:::

## The idea

Finishing a reading is a moment worth marking. Without a ritual, the article is closed and joins the pile of things read once. With one, the end of reading becomes a short sequence: gather what you wrote, note that you read it, and set the next step. A single command does the mechanical part, so the attention goes to deciding what the reading was worth.

## An example from a real reading

The last paragraph of *Why we forget what we read* is read. One hotkey runs *End of reading*: the comments are extracted, a line "2026-11-01 [[Why we forget what we read]]" is added to `Reading log.md`, and the script sets the property `status: read` on the note. The extraction note opens, ready for the [periodic review](/method/periodic-review/).

## The setting

First, the script `Scripts/mark-read.js`:

```js
module.exports = async (params, settings) => {
  const { app } = params;
  const file = app.workspace.getActiveFile();
  if (!file) throw new Error("No active note");
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm[settings.property ?? "status"] = settings.value ?? "read";
  });
  const log = app.vault.getAbstractFileByPath(settings.log ?? "Reading log.md");
  const line = `- ${window.moment().format("YYYY-MM-DD")} [[${file.basename}]]\n`;
  if (log) await app.vault.append(log, line);
  else await app.vault.create(settings.log ?? "Reading log.md", line);
};
```

Then a [Chain](/concepts/chain/) action named *End of reading*, with *Command* on:

| Step | Type | Value |
|---|---|---|
| 1 | Obsidian command | *Extract comments from this note* (`hypomnema:extract-note`), picked with *Choose…* |
| 2 | Script | `Scripts/mark-read.js`, settings `property = status`, `value = read`, `log = Reading log.md` |

The first run of the script asks for confirmation and names the file. If a step fails, the chain stops and a notice says why. See [Scripts](/advanced/scripts/) for the security warning.

## Variants

**Without a script.** Replace step 2 with a QuickAdd *Capture* called through its command (*Obsidian command* step), as in the [QuickAdd](/integrations/quickadd/) recipe.

**Sharing values.** `params.variables` holds the values typed for `{{VALUE:…}}` in earlier steps. The script can read them, for instance `params.variables["verdict"]` to write *read*, *to reread* or *dropped*, and set new ones for the following steps.

**Wait for the view.** If a step opens a note that the next step needs, add a *Pause (ms)* step of 300 between them.
