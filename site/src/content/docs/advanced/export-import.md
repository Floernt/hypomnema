---
title: Export and import
description: Share your actions as JSON.
sidebar:
  order: 5
---

:::note
Available from version 0.5.0. The buttons are in the *Advanced* section of the settings, shown when *Advanced features* is on.
:::

Actions travel as JSON. You can share a reading method with someone else, or move it from one vault to another.

## Export

*Export actions* copies all your actions to the clipboard, in this form:

```json
{ "hypomnema": 1, "actions": [ … ] }
```

To share only some actions, remove the others from the `actions` array before sending the text.

## Import

*Import actions* opens a dialog where you paste an export. Hypomnema adds the actions it contains:

- ids that already exist in your vault are regenerated, so nothing is overwritten;
- categories the actions use but your vault lacks are reported, not created: add them in the *Categories* section if you want them;

Read an imported chain before running it: it can call any Obsidian command.
