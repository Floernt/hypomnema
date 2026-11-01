---
title: QuickAdd
description: Enchaîner les commandes d'Hypomnema avec ses propres macros QuickAdd.
sidebar:
  order: 3
---

[QuickAdd](https://quickadd.obsidian.guide/) n'est pas nécessaire. Les [enchaînements](/fr/concepts/chain/) d'Hypomnema couvrent ce qui touche l'annotation ; QuickAdd sert quand on a déjà des macros et qu'on veut faire d'Hypomnema l'une de leurs étapes.

## Ce qu'il apporte

Les macros QuickAdd enchaînent des commandes, des captures et des scripts de n'importe quel plugin. Chaque commande d'Hypomnema peut en être une étape : la fin d'une lecture alimente alors un journal, une note de projet ou une note quotidienne que QuickAdd gère déjà.

## Recette minimale : extraire en fin de lecture

1. Dans les réglages de QuickAdd, créez un choix *Macro*, par exemple « Fin de lecture ».
2. Ajoutez une étape *Obsidian command* : **Hypomnema: Extraire les commentaires de cette note**.
3. Ajoutez ensuite les étapes voulues, par exemple une *Capture* vers une note « Journal de lecture » au format `- {{DATE}} [[{{LINKCURRENT}}]]`.
4. Activez la commande de la macro (l'icône éclair) pour la lancer depuis la palette ou un raccourci.

La même commande est accessible à tout plugin ou script : `app.commands.executeCommandById("hypomnema:extract-note")`.

## Variante : gestes et API dans une macro

:::note
Disponible à partir de la version 0.5.0.
:::

Chaque [geste](/fr/concepts/gestures/) dont l'option *Commande* est activée devient la commande `hypomnema:geste-<id>` : il apparaît dans l'étape *Obsidian command* de QuickAdd comme n'importe quelle autre commande.

Un script utilisateur QuickAdd peut aussi appeler l'[API publique](/fr/advanced/api/). Les scripts écrits pour Hypomnema reprennent la signature de ceux de QuickAdd : le même fichier fonctionne dans les deux.

```js
module.exports = async (params) => {
  const api = params.app.plugins.plugins.hypomnema?.api;
  if (!api) throw new Error("Hypomnema n'est pas activé");
  const file = params.app.workspace.getActiveFile();
  const threads = await api.threads(file);
  new Notice(`${threads.length} commentaire(s) dans ${file.basename}`);
};
```

Pour réagir à Hypomnema depuis l'extérieur, on s'abonne à ses événements, par exemple pour consigner chaque extraction :

```js
app.workspace.on("hypomnema:extracted", (d) => console.log(`${d.added} commentaire(s) → ${d.file.path}`));
```

Les événements et leur contenu sont décrits sur la page [API](/fr/advanced/api/#événements).
