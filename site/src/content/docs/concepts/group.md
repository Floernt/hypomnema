---
title: Group
description: An action that opens a menu of other actions.
sidebar:
  order: 8
---

:::note
Available from version 0.5.0. Groups belong to level 3: turn on *Advanced features* in the settings to create one.
:::

A group gathers several actions behind a single command. Running it opens a searchable menu that lists its children; picking one runs it.

```ts
interface GroupAction extends ActionBase { kind: "group"; children: string[]; }
```

`children` holds action ids, in the order the menu shows them. A child can be any kind of action, including a chain or another group. If a group ends up calling itself, directly or through another group or chain, the run stops with a notice.

## Example

A group *Read* with one hotkey can hold the annotation actions you use most: *Objection*, *To verify*, *Quote*. One shortcut, then two or three letters to pick the one you want. The actions keep their own commands if you want direct hotkeys for some of them.
