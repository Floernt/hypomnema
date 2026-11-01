---
title: Export and import
description: Share your gestures as JSON.
sidebar:
  order: 5
---

:::note
Available from version 0.5.0. The buttons are in the *Advanced* section of the settings, shown when *Advanced features* is on.
:::

Gestures travel as JSON. You can share a reading method with someone else, or move it from one vault to another.

## Export

*Export gestures* copies all your gestures to the clipboard, in this form:

```json
{ "hypomnema": 1, "gestes": [ … ] }
```

The paths of [scripts](/advanced/scripts/) are exported as they are, without the code. To share only some gestures, remove the others from the `gestes` array before sending the text.

## Import

*Import gestures* opens a dialog where you paste an export. Hypomnema adds the gestures it contains:

- ids that already exist in your vault are regenerated, so nothing is overwritten;
- categories the gestures use but your vault lacks are reported, not created: add them in the *Categories* section if you want them;
- scripts referred to by path must be added to your vault separately.

Read an imported chain before running it, and the scripts it calls in particular.
