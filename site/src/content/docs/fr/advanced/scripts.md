---
title: Scripts
description: Du JavaScript avec Hypomnema, par les scripts utilisateur de QuickAdd ou de Templater.
sidebar:
  order: 4
---

:::note
Hypomnema n'exécute plus de JavaScript lui-même. L'étape *Script* des enchaînements, apparue en 0.5.0, a été retirée en 0.6.0 : la revue du catalogue d'Obsidian décourage un plugin d'exécuter du code. Les scripts passent désormais par [QuickAdd](/fr/integrations/quickadd/) ou [Templater](/fr/integrations/templater/), qui sont faits pour cela, et qui appellent Hypomnema par son [API publique](/fr/advanced/api/).
:::

:::danger[Un script a les mêmes droits qu'un plugin]
Un script peut lire, modifier et supprimer n'importe quel fichier du coffre, et accéder au réseau. N'exécutez que des scripts que vous avez écrits vous-même, ou que vous avez lus et compris.
:::

## Avec QuickAdd

Un script utilisateur QuickAdd est un fichier `.js` du coffre, ajouté comme étape d'une macro QuickAdd :

```js
module.exports = async (params) => {
  const { app, variables } = params;
  const api = app.plugins.plugins.hypomnema?.api;
  if (!api) throw new Error("Hypomnema n'est pas activé");
  // …
};
```

Depuis le script, l'API donne accès aux commentaires (`api.threads`, `api.allThreads`), permet d'en ajouter (`api.addComment`, `api.reply`) et lance une action d'Hypomnema avec `api.runAction(id, vars)`. Les valeurs de `vars` répondent aux `{{VALUE:…}}` de l'action, qui ne pose donc pas la question. Une macro QuickAdd peut ainsi faire ce que faisait un enchaînement avec script : ses étapes appellent les commandes d'Hypomnema, et ses scripts lui passent des valeurs.

## Exemple

```js
// Scripts/compter.js — affiche le nombre de commentaires de la note active
module.exports = async ({ app }) => {
  const api = app.plugins.plugins.hypomnema?.api;
  const file = app.workspace.getActiveFile();
  if (!api || !file) throw new Error("Hypomnema inactif ou aucune note active");
  const threads = await api.threads(file);
  new Notice(`${threads.length} commentaire(s)`);
};
```

Un exemple plus complet figure dans la note de méthode [La fin de lecture](/fr/method/end-of-reading/).

## Reprendre un script écrit pour la 0.5

Les scripts de la 0.5 avaient déjà la signature des scripts QuickAdd. Pour les reprendre :

1. Remplacez `params.api` par `params.app.plugins.plugins.hypomnema.api`, et `params.obsidian.Notice` (ou tout autre élément du module) par `Notice`, que QuickAdd met à disposition.
2. Les réglages de l'étape (`settings`) n'existent plus : écrivez les valeurs en tête du script, ou demandez-les avec `params.quickAddApi.inputPrompt`.
3. Dans la macro QuickAdd, `params.variables` est partagé entre les étapes, comme l'était celui de l'enchaînement.
4. Supprimez l'étape *Script (retiré)* de l'enchaînement d'Hypomnema. Elle reste affichée dans l'éditeur pour cela, mais ne s'exécute plus.
