---
title: Kanban
description: Relire ses commentaires sur un tableau Kanban, une colonne par catégorie.
sidebar:
  order: 2
---

Le plugin [Kanban](https://github.com/mgmeyers/obsidian-kanban) n'est pas nécessaire : sans lui, une extraction au format Kanban reste une note Markdown lisible, faite de titres et de tâches. Avec lui, la note s'ouvre comme un tableau.

## Ce qu'il apporte

Un tableau fait de l'extraction une relecture. Chaque commentaire est une carte que l'on déplace une fois traitée : la note rédigée, la source vérifiée, la question tranchée. Le lien ↩ de chaque carte ramène au passage.

## Recette minimale : un tableau de relecture par lecture

Choisissez le format *Tableau Kanban* dans *Paramètres → Hypomnema → Extraction*. Lancez *Extraire les commentaires de cette note*. Chaque catégorie devient une colonne, plus une colonne *Fait*, vide au départ.

![Extraction depuis la palette de commandes : un tableau Kanban s'ouvre](/screenshots/10-extract-fr.gif)

Déplacez une carte dans *Fait* quand le commentaire a été traité. Une extraction ultérieure n'ajoute que les commentaires écrits depuis, dans la colonne de leur catégorie ; les cartes déplacées restent où elles sont.

![Un tableau Kanban de commentaires extraits](/screenshots/10-extract-kanban-fr.png)

## Variante : un tableau hebdomadaire pour tout le coffre

:::note
Disponible à partir de la version 0.5.0.
:::

Une action [Extraction](/fr/concepts/extraction/) de portée *Tout le coffre*, avec *Actifs depuis* réglé sur `{{date-7d}}` et le format Kanban, rassemble sur un seul tableau les commentaires de la semaine, toutes notes confondues. La note de méthode [La revue périodique](/fr/method/periodic-review/) donne le réglage complet.

Un [gabarit](/fr/concepts/template/) ne s'applique pas au format Kanban : la structure qu'attend le plugin Kanban est trop stricte pour y mêler du texte libre.
