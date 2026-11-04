---
title: Enchaînement
description: Une action qui exécute une suite d'étapes, actions, commandes et pauses.
sidebar:
  order: 7
---

:::note
Disponible à partir de la version 0.5.0. Les enchaînements relèvent du niveau 3 : activez les *Fonctions avancées* dans les réglages pour en créer un.
:::

Un enchaînement exécute une suite d'étapes, dans l'ordre.

```ts
type Step =
  | { type: "action"; id: string }
  | { type: "command"; id: string }
  | { type: "wait"; ms: number };

interface ChainAction extends ActionBase { kind: "chain"; steps: Step[]; }
```

## Les étapes

Une étape **Action** lance une autre action. Une étape **Commande Obsidian** lance n'importe quelle commande Obsidian, choisie avec *Choisir…*, par exemple *Extraire les commentaires de cette note* (`hypomnema:extract-note`) ou la commande d'un autre plugin. L'étape **Script** a été retirée en 0.6.0 : une étape de ce type, créée avec la 0.5, reste affichée pour être supprimée mais ne s'exécute plus. Le JavaScript passe par QuickAdd ou Templater, voir [Scripts](/fr/advanced/scripts/). Une étape **Pause (ms)** attend un nombre de millisecondes, ce qui sert quand une commande précédente ouvre une note ou une vue qui met du temps à se charger.

## L'exécution

Les étapes s'exécutent l'une après l'autre. L'enchaînement s'arrête à la première erreur, signalée par une notification ; les étapes restantes ne sont pas exécutées.

Les valeurs saisies pour les variables `{{VALUE:…}}` dans une étape restent disponibles pour les suivantes. Si la première étape demande `{{VALUE:projet}}`, une extraction ultérieure peut reprendre `{{VALUE:projet}}` dans le nom de sa note sans reposer la question.

Un enchaînement ne peut pas s'appeler lui-même, ni directement ni par l'intermédiaire d'un autre enchaînement ou d'un groupe : si un cycle est détecté, l'exécution s'arrête avec une notification.

## Exemple

Un enchaînement « Extraction de projet » peut demander `{{VALUE:projet}}` à sa première étape, une action *Annotation*, puis lancer une action *Extraction* dont le nom de note reprend `{{VALUE:projet}}`. Pour aller plus loin avec du JavaScript, la note de méthode [La fin de lecture](/fr/method/end-of-reading/) passe par une macro QuickAdd.
