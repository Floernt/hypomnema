---
title: La fin de lecture
description: Une macro QuickAdd qui extrait les commentaires, consigne la lecture et marque la note comme lue.
sidebar:
  order: 6
---

:::note
Disponible à partir de la version 0.5.0. Depuis la 0.6.0, le script passe par une macro [QuickAdd](/fr/integrations/quickadd/) : Hypomnema n'exécute plus de JavaScript lui-même (voir [Scripts](/fr/advanced/scripts/)).
:::

:::caution[Brouillon — section à réécrire par l'auteur]
« L'idée » et « Un exemple vécu » sont un brouillon.
:::

## L'idée

Terminer une lecture est un moment qui mérite d'être marqué. Sans rituel, l'article se referme et rejoint la pile des choses lues une fois. Avec un rituel, la fin de lecture devient une courte séquence : rassembler ce qu'on a écrit, noter qu'on l'a lu, fixer la suite. Une seule commande prend en charge la partie mécanique, et l'attention va à ce qui compte : décider ce que valait la lecture.

## Un exemple vécu

Le dernier paragraphe de *Pourquoi on oublie ce qu'on lit* est lu. Un raccourci lance « Fin de lecture » : les commentaires sont extraits, une ligne « 2026-11-01 [[Pourquoi on oublie ce qu'on lit]] » s'ajoute au `Journal de lecture.md`, et le script pose la propriété `statut: lu` sur la note. La note d'extraction s'ouvre, prête pour la [revue périodique](/fr/method/periodic-review/).

## Le réglage

D'abord le script utilisateur QuickAdd `Scripts/marquer-lu.js` :

```js
const PROPRIETE = "statut";
const VALEUR = "lu";
const JOURNAL = "Journal de lecture.md";

module.exports = async ({ app }) => {
  const file = app.workspace.getActiveFile();
  if (!file) throw new Error("Aucune note active");
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm[PROPRIETE] = VALEUR;
  });
  const log = app.vault.getAbstractFileByPath(JOURNAL);
  const line = `- ${window.moment().format("YYYY-MM-DD")} [[${file.basename}]]\n`;
  if (log) await app.vault.append(log, line);
  else await app.vault.create(JOURNAL, line);
};
```

Puis, dans QuickAdd, un choix *Macro* nommé « Fin de lecture », dont la commande est activée (l'icône éclair) :

| Étape | Type QuickAdd | Valeur |
|---|---|---|
| 1 | *Obsidian command* | **Hypomnema: Extraire les commentaires de cette note** (`hypomnema:extract-note`) |
| 2 | *User script* | `Scripts/marquer-lu.js` |

Si une étape échoue, QuickAdd arrête la macro et affiche l'erreur. Voir [Scripts](/fr/advanced/scripts/) pour l'avertissement de sécurité.

## Variantes

**Sans script.** Remplacez l'étape 2 par une *Capture* QuickAdd vers le journal de lecture, comme dans la recette [QuickAdd](/fr/integrations/quickadd/).

**Passer des valeurs à Hypomnema.** Un script de la macro peut lancer une action d'Hypomnema en répondant à ses `{{VALUE:…}}` : `api.runAction("<id>", { verdict: "à relire" })`. L'action ne pose alors pas la question. `params.variables` partage les valeurs entre les étapes de la macro.

**Attendre la vue.** Si une étape ouvre une note dont l'étape suivante a besoin, ajoutez entre elles une étape *Wait* de QuickAdd, de 300 ms.
