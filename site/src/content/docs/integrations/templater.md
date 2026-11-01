---
title: Templater
description: Run Templater tags in extraction templates, or call the API from a Templater template.
sidebar:
  order: 4
---

:::note
Available from version 0.5.0.
:::

[Templater](https://silentvoid13.github.io/Templater/) is not required. Hypomnema's own [variables](/concepts/variables/) cover dates, names, prompts and global values. Templater adds what they do not: JavaScript in a template, and its own library of functions.

## What it brings

When an extraction note is created from a [template](/concepts/template/), Templater can run the `<% … %>` tags of that template. You can compute a value, ask a question with a list of choices, or move the note once it is created.

## Minimal recipe: Templater tags in an extraction template

1. Enable Templater.
2. In an [Extraction](/concepts/extraction/) gesture with a template, open *More options* and turn on *Run Templater*. It is off by default, and only shown when Templater is enabled. The default extraction has the same option behind the *More options* button of the *Extraction* section.
3. Add Templater tags to the template:

```markdown
# {{note}}

Author: <% await tp.system.prompt("Author") %>
Read on {{today}}

{{comments}}
```

Hypomnema resolves its own `{{…}}` variables first, creates the note, then hands it to Templater, which runs the `<% … %>` tags.

## Variant: the API from a Templater template

Any Templater template can reach Hypomnema through `tp.app`. This one inserts the number of comments in the active note:

```markdown
<%*
const api = tp.app.plugins.plugins.hypomnema?.api;
const file = tp.app.workspace.getActiveFile();
const threads = api && file ? await api.threads(file) : [];
tR += `${threads.length} comment(s)`;
%>
```

See the [API](/advanced/api/) for the other functions.
