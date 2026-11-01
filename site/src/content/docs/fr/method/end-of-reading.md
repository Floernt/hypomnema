---
title: La fin de lecture
description: Un enchaînement qui extrait, consigne la lecture et lance un script.
sidebar:
  order: 6
---

:::note
Disponible à partir de la version 0.5.0. Cette note utilise un enchaînement et un script : activez les *Fonctions avancées* dans les réglages.
:::

:::caution[Brouillon — section à réécrire par l'auteur]
« L'idée » et « Un exemple vécu » sont un brouillon.
:::

## L'idée

Terminer une lecture est un moment qui mérite d'être marqué. Sans rituel, l'article se referme et rejoint la pile des choses lues une fois. Avec un rituel, la fin de lecture devient une courte séquence : rassembler ce qu'on a écrit, noter qu'on l'a lu, fixer la suite. Une seule commande prend en charge la partie mécanique, et l'attention va à ce qui compte : décider ce que valait la lecture.

## Un exemple vécu

Le dernier paragraphe de *Pourquoi on oublie ce qu'on lit* est lu. Un raccourci lance « Fin de lecture » : les commentaires sont extraits, une ligne « 2026-11-01 [[Pourquoi on oublie ce qu'on lit]] » s'ajoute au `Journal de lecture.md`, et le script pose la propriété `statut: lu` sur la note. La note d'extraction s'ouvre, prête pour la [revue périodique](/fr/method/periodic-review/).

## Le réglage

D'abord le script `Scripts/marquer-lu.js` :

```js
module.exports = async (params, settings) => {
  const { app } = params;
  const file = app.workspace.getActiveFile();
  if (!file) throw new Error("Aucune note active");
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm[settings.property ?? "statut"] = settings.value ?? "lu";
  });
  const log = app.vault.getAbstractFileByPath(settings.log ?? "Journal de lecture.md");
  const line = `- ${window.moment().format("YYYY-MM-DD")} [[${file.basename}]]\n`;
  if (log) await app.vault.append(log, line);
  else await app.vault.create(settings.log ?? "Journal de lecture.md", line);
};
```

Puis une action [Enchaînement](/fr/concepts/chain/) nommée « Fin de lecture », option *Commande* activée :

| Étape | Type | Valeur |
|---|---|---|
| 1 | Commande Obsidian | *Extraire les commentaires de cette note* (`hypomnema:extract-note`), choisie avec *Choisir…* |
| 2 | Script | `Scripts/marquer-lu.js`, réglages `property = statut`, `value = lu`, `log = Journal de lecture.md` |

Le premier lancement du script demande une confirmation qui nomme le fichier. Si une étape échoue, l'enchaînement s'arrête et une notification en donne la raison. Voir [Scripts](/fr/advanced/scripts/) pour l'avertissement de sécurité.

## Variantes

**Sans script.** Remplacez l'étape 2 par une *Capture* QuickAdd appelée par sa commande (étape *Commande Obsidian*), comme dans la recette [QuickAdd](/fr/integrations/quickadd/).

**Partager des valeurs.** `params.variables` contient les valeurs saisies pour les `{{VALUE:…}}` des étapes précédentes. Le script peut les lire, par exemple `params.variables["verdict"]` pour écrire « lu », « à relire » ou « abandonné », et en définir de nouvelles pour les étapes suivantes.

**Attendre la vue.** Si une étape ouvre une note dont l'étape suivante a besoin, ajoutez entre elles une étape *Pause (ms)* de 300.
