---
title: Installation
description: Installer Hypomnema dans un coffre Obsidian.
sidebar:
  order: 1
---

Hypomnema demande Obsidian 1.7.2 ou plus récent. Il fonctionne sur ordinateur et sur mobile.

## Depuis une release

En attendant sa publication dans le catalogue communautaire, le plugin s'installe à la main :

1. Téléchargez `main.js`, `manifest.json` et `styles.css` depuis la [dernière release](https://github.com/Floernt/hypomnema/releases/latest).
2. Copiez-les dans `<coffre>/.obsidian/plugins/hypomnema/`.
3. Activez le plugin dans *Paramètres → Modules complémentaires*.

Chaque fichier de release est construit sur GitHub à partir du dépôt, puis attesté. On peut vérifier un fichier téléchargé avec `gh attestation verify main.js -R Floernt/hypomnema`.

## Langue

L'interface du plugin suit la langue d'Obsidian : en français quand Obsidian est en français, en anglais sinon.

## Ensuite

[Écrire un premier commentaire](/fr/getting-started/first-comment/).
