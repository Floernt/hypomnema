---
title: Installation
description: Installer Hypomnema dans un coffre Obsidian.
sidebar:
  order: 1
---

Hypomnema demande Obsidian 1.7.2 ou plus récent. Il fonctionne sur ordinateur et sur mobile.

## Depuis le catalogue communautaire

1. Ouvrez *Paramètres → Modules complémentaires* et, si besoin, désactivez le mode restreint.
2. Cliquez sur *Parcourir* et cherchez « Hypomnema ».
3. Cliquez sur *Installer*, puis sur *Activer*.

Depuis un appareil où Obsidian est installé, ce lien ouvre directement la fiche du plugin : [obsidian://show-plugin?id=hypomnema](obsidian://show-plugin?id=hypomnema).

Les mises à jour arrivent par le même chemin : *Paramètres → Modules complémentaires → Rechercher des mises à jour*.

## Sur mobile

Un téléphone n'a pas de clic droit. Deux chemins mènent à la commande *Commenter la sélection ou le curseur* :

- **l'appui long** sur le texte, qui ouvre le menu de l'éditeur, où figure *Commenter la sélection* ;
- **la barre d'outils mobile** : ajoutez-y la commande dans *Paramètres → Mobile*, pour l'avoir sous la main au-dessus du clavier.

## À la main, depuis une release

Pour tester une version avant sa publication dans le catalogue :

1. Téléchargez `main.js`, `manifest.json` et `styles.css` depuis la [dernière release](https://github.com/Floernt/hypomnema/releases/latest).
2. Copiez-les dans `<coffre>/.obsidian/plugins/hypomnema/`.
3. Activez le plugin dans *Paramètres → Modules complémentaires*.

Chaque fichier de release est construit sur GitHub à partir du dépôt, puis attesté. On peut vérifier un fichier téléchargé avec `gh attestation verify main.js -R Floernt/hypomnema`.

## Langue

L'interface du plugin suit la langue d'Obsidian : en français quand Obsidian est en français, en anglais sinon.

## Ensuite

[Écrire un premier commentaire](/fr/getting-started/first-comment/).
