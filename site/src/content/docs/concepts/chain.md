---
title: Chain
description: An action that runs a sequence of steps, other actions, commands and pauses.
sidebar:
  order: 7
---

:::note
Available from version 0.5.0. Chains belong to level 3: turn on *Advanced features* in the settings to create one.
:::

A chain runs a sequence of steps, in order.

```ts
type Step =
  | { type: "action"; id: string }
  | { type: "command"; id: string }
  | { type: "wait"; ms: number };

interface ChainAction extends ActionBase { kind: "chain"; steps: Step[]; }
```

## Steps

An **Action** step runs another action. An **Obsidian command** step runs any Obsidian command, picked with *Choose…*, for instance *Extract comments from this note* (`hypomnema:extract-note`) or a command from another plugin. The **Script** step was removed in 0.6.0: a step of that type created with 0.5 stays visible so it can be deleted, but no longer runs. JavaScript goes through QuickAdd or Templater, see [Scripts](/advanced/scripts/). A **Pause (ms)** step waits for a number of milliseconds, which helps when a previous command opens a note or a view that needs time to load.

## Running

Steps run one after the other. The chain stops at the first error, which is reported in a notice; the remaining steps do not run.

Values typed for `{{VALUE:…}}` variables in one step stay available to the following ones. If the first step asks for `{{VALUE:project}}`, a later extraction can use `{{VALUE:project}}` in its note name without asking again.

A chain cannot call itself, directly or through another chain or a group: if a cycle is detected, the run stops with a notice.

## Example

A *Project extraction* chain can ask for `{{VALUE:project}}` in its first step, an *Annotation* action, then run an *Extraction* action whose note name reuses `{{VALUE:project}}`. To go further with JavaScript, the method note [End of reading](/method/end-of-reading/) uses a QuickAdd macro.
