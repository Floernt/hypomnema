---
title: Installation
description: Install Hypomnema in an Obsidian vault.
sidebar:
  order: 1
---

Hypomnema needs Obsidian 1.7.2 or later. It works on desktop and mobile.

## From a release

Until the plugin is listed in the community directory, install it by hand:

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Floernt/hypomnema/releases/latest).
2. Put them in `<vault>/.obsidian/plugins/hypomnema/`.
3. Enable the plugin under *Settings → Community plugins*.

Each release file is built on GitHub from the repository and attested. You can check a downloaded file with `gh attestation verify main.js -R Floernt/hypomnema`.

## Language

The plugin's interface follows Obsidian's language: French when Obsidian is set to French, English otherwise.

## Next

[Write a first comment](/getting-started/first-comment/).
