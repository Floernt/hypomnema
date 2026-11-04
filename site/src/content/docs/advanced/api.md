---
title: API
description: The public API and the events, for scripts, QuickAdd, Templater and DataviewJS.
sidebar:
  order: 2
---

:::note
Available from version 0.5.0.
:::

The API is reachable from anywhere Obsidian's `app` is: a QuickAdd script, `tp.app` in Templater, a DataviewJS block, another plugin.

```js
const api = app.plugins.plugins.hypomnema?.api;
```

Check that `api` exists before using it: the plugin may be disabled.

## Functions

```ts
api.version                                  // "1"
api.threads(file: TFile): Promise<Thread[]>
api.allThreads(opts?: { folder?: string; categories?: string[]; since?: string }): Promise<{ file: TFile; thread: Thread }[]>
api.addComment(file, target: { quote: string; occurrence?: number } | { line: number }, text: string, tag?: string): Promise<string>
api.reply(file, id, text): Promise<void>
api.runAction(id: string, vars?: Record<string, string>): Promise<void>
api.format(template: string, vars?: Record<string, string>): string
```

**`threads`** returns the threads of a note. **`allThreads`** returns the threads of a folder, or of the whole vault, filtered by category tags and by a `since` date (`YYYY-MM-DD`) as for an [extraction](/concepts/extraction/#filter).

A `Thread` has an `id` (`a1`), a `root` entry and its `replies` (each with `id`, `date`, `tag` for the root, and `text`), the commented `quote`, and an `anchor` that is `null` when the markers were deleted.

**`addComment`** adds a comment and returns its id. The target is either a passage, `{ quote }`, or a line, `{ line }`. With `{ line }`, counted from 0, the comment is a point comment placed at the end of that line. With `{ quote }`, if the passage is missing, or appears more than once, the call throws an explicit error unless `occurrence: n` says which one (counted from 1). The API never picks in silence.

**`reply`** adds a reply to a thread. **`runAction`** runs an [action](/concepts/actions/) by its id; `vars` prefills its `{{VALUE:…}}` prompts. **`format`** resolves the [variable syntax](/concepts/variables/) in a string; the entries of `vars` also answer the `{{VALUE:…}}` prompts, so `api.format("Review {{VALUE:topic}}", { topic: "memory" })` gives `Review memory`.

A write through the API has the same effects as a write through the interface: the category tag is synced in the note's properties, and the `hypomnema:comment-added` event fires, whether the note is open or not. Writes go through `vault.process`, so they do not conflict with the editor.

## Example

```js
const api = app.plugins.plugins.hypomnema.api;
const file = app.workspace.getActiveFile();
const id = await api.addComment(file, { quote: "memory is a reconstruction" }, "Compare with Bartlett, 1932.", "to-verify");
await api.reply(file, id, "Checked: chapter 10.");
```

## Events

Hypomnema triggers three events on `app.workspace`. Each handler receives a single object. A script or another plugin can subscribe with `app.workspace.on`:

| Event | When | Payload |
|---|---|---|
| `hypomnema:comment-added` | A comment or a reply is added, from the interface or the API. | `{ file: TFile, id, text, tag? }`; for a reply, `id` is `aN.k` |
| `hypomnema:comment-edited` | A comment is edited. | `{ file: TFile, id, text, tag? }` |
| `hypomnema:extracted` | An extraction has written its note. | `{ file: TFile, added: number, sources: string[] }`: the extraction note, the number of comments added, the paths of the source notes |

```js
const ref = app.workspace.on("hypomnema:extracted", (d) => {
  console.log(`${d.added} comment(s) extracted to ${d.file.path} from ${d.sources.join(", ")}`);
});
// later: app.workspace.offref(ref);
```
