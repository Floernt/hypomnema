---
title: Scripts
description: Des fichiers JavaScript du coffre exécutés comme étape d'un enchaînement.
sidebar:
  order: 4
---

:::note
Disponible à partir de la version 0.5.0. Les scripts relèvent du niveau 3 : ils n'apparaissent que si les *Fonctions avancées* sont activées.
:::

:::danger[Un script a les mêmes droits que le plugin]
Un script peut lire, modifier et supprimer n'importe quel fichier du coffre, et accéder au réseau. N'exécutez que des scripts que vous avez écrits vous-même, ou que vous avez lus et compris.
:::

Un script est un fichier `.js` du coffre, exécuté comme étape *Script* d'un [enchaînement](/fr/concepts/chain/). Il suit la convention de QuickAdd : un script écrit pour l'un fonctionne dans l'autre.

## Signature

```js
module.exports = async (params, settings) => {
  const { app, api, variables, obsidian } = params;
  // …
};
```

`app` est l'objet `App` d'Obsidian. `api` est l'[API publique](/fr/advanced/api/) d'Hypomnema. `obsidian` est le module Obsidian, qui donne accès à `Notice`, `Modal`, `TFile` et au reste sans import. `variables` contient les réponses aux invites `{{VALUE:…}}` ; il est partagé par toutes les étapes de l'enchaînement, si bien qu'un script peut lire les valeurs saisies plus tôt, et modifier ou ajouter des valeurs que les étapes suivantes verront.

`settings` contient les paires clé → valeur réglées sur l'étape script : un même fichier peut ainsi servir à plusieurs enchaînements, avec des réglages différents.

L'export peut aussi être un objet doté d'une fonction `entry`, comme dans QuickAdd :

```js
module.exports = { entry: async (params, settings) => { /* … */ } };
```

## Exécution

Hypomnema demande une confirmation, qui nomme le fichier, au premier lancement d'un script, puis à nouveau chaque fois que le contenu du fichier change. Si le script lève une erreur, l'enchaînement s'arrête et une notification affiche le message.

## Exemple

```js
// Scripts/compter.js — affiche le nombre de commentaires de la note active
module.exports = async ({ app, api, variables, obsidian }, settings) => {
  const file = app.workspace.getActiveFile();
  if (!file) throw new Error("Aucune note active");
  const threads = await api.threads(file);
  variables.nombre = String(threads.length);
  new obsidian.Notice(`${threads.length} commentaire(s)`);
};
```

Une étape suivante peut utiliser `{{VALUE:nombre}}` sans que la question soit posée. Un exemple plus complet figure dans la note de méthode [La fin de lecture](/fr/method/end-of-reading/).

## Partage

L'[export](/fr/advanced/export-import/) copie le chemin d'un script, jamais son code. Qui importe le geste doit ajouter le fichier à son propre coffre.
