---
title: Enchaînement
description: Un geste qui exécute une suite d'étapes, gestes, commandes, scripts et pauses.
sidebar:
  order: 7
---

:::note
Disponible à partir de la version 0.5.0. Les enchaînements relèvent du niveau 3 : activez les *Fonctions avancées* dans les réglages pour en créer un.
:::

Un enchaînement exécute une suite d'étapes, dans l'ordre. C'est la *Macro* de QuickAdd, limitée à ce qui touche la lecture et l'annotation.

```ts
type Step =
  | { type: "geste"; id: string }
  | { type: "command"; id: string }
  | { type: "script"; path: string; settings?: Record<string, string> }
  | { type: "wait"; ms: number };

interface ChainGeste extends GesteBase { kind: "chain"; steps: Step[]; }
```

## Les étapes

Une étape **Geste** lance un autre geste. Une étape **Commande Obsidian** lance n'importe quelle commande Obsidian, choisie avec *Choisir…*, par exemple *Extraire les commentaires de cette note* (`hypomnema:extract-note`) ou la commande d'un autre plugin. Une étape **Script** exécute un fichier `.js` du coffre, avec des réglages facultatifs ; voir [Scripts](/fr/advanced/scripts/). Une étape **Pause (ms)** attend un nombre de millisecondes, ce qui sert quand une commande précédente ouvre une note ou une vue qui met du temps à se charger.

## L'exécution

Les étapes s'exécutent l'une après l'autre. L'enchaînement s'arrête à la première erreur, signalée par une notification ; les étapes restantes ne sont pas exécutées.

Les valeurs saisies pour les variables `{{VALUE:…}}` dans une étape restent disponibles pour les suivantes. Si la première étape demande `{{VALUE:projet}}`, une extraction ultérieure peut reprendre `{{VALUE:projet}}` dans le nom de sa note sans reposer la question. Les scripts lisent et modifient ces valeurs par `params.variables`.

Un enchaînement ne peut pas s'appeler lui-même, ni directement ni par l'intermédiaire d'un autre enchaînement ou d'un groupe : si un cycle est détecté, l'exécution s'arrête avec une notification.

## Exemple

La note de méthode [La fin de lecture](/fr/method/end-of-reading/) construit un enchaînement en deux étapes : extraire les commentaires de la note, puis lancer un script qui consigne la lecture dans un journal et marque la note comme lue.
