---
title: Installation
description: Install Hypomnema in an Obsidian vault.
sidebar:
  order: 1
---

Hypomnema needs Obsidian 1.7.2 or later. It works on desktop and mobile.

## From the community directory

1. Open *Settings → Community plugins* and, if needed, turn off restricted mode.
2. Click *Browse* and search for "Hypomnema".
3. Click *Install*, then *Enable*.

On a device where Obsidian is installed, this link opens the plugin's page directly: [obsidian://show-plugin?id=hypomnema](obsidian://show-plugin?id=hypomnema).

Updates come the same way: *Settings → Community plugins → Check for updates*.

## On mobile

A phone has no right-click. Two paths lead to the command *Comment on selection or cursor*:

- **a long press** on the text, which opens the editor menu with *Comment on selection*;
- **the mobile toolbar**: add the command under *Settings → Mobile* to keep it at hand above the keyboard.

## By hand, from a release

To try a version before it reaches the directory:

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Floernt/hypomnema/releases/latest).
2. Put them in `<vault>/.obsidian/plugins/hypomnema/`.
3. Enable the plugin under *Settings → Community plugins*.

Each release file is built on GitHub from the repository and attested. You can check a downloaded file with `gh attestation verify main.js -R Floernt/hypomnema`.

## Language

The plugin's interface follows Obsidian's language: French when Obsidian is set to French, English otherwise.

## Next

[Write a first comment](/getting-started/first-comment/).
