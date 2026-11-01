---
title: Variables
description: La syntaxe {{…}} commune à toutes les actions, et les variables globales.
sidebar:
  order: 6
---

:::note
Les variables par commentaire du gabarit de ligne, ainsi que `{{note}}` et `{{date}}` dans le nom de la note, sont disponibles dès maintenant. Le reste de cette page est disponible à partir de la version 0.5.0.
:::

Toutes les actions partagent la même syntaxe : un nom entre doubles accolades, `{{nom}}`, parfois suivi d'un argument, `{{nom:argument}}`, ou d'un décalage en jours, `{{date-7d}}`. Une variable inconnue est laissée telle quelle. La [table des variables](/fr/reference/variables/) les recense toutes.

## Familles

**Par commentaire**, dans le gabarit de ligne de l'extraction : `{{text}}`, `{{quote}}`, `{{tag}}`, `{{category}}`, `{{date}}`, `{{note}}`, `{{link}}`, `{{id}}`.

**Contexte** : `{{note}}`, `{{selection}}`, `{{cursor}}` (annotation seulement), `{{sources}}` et `{{comments}}` (gabarits seulement).

**Dates** : `{{date}}` (AAAA-MM-JJ), `{{date:FORMAT}}` avec un [format Moment.js](https://momentjs.com/docs/#/displaying/format/), `{{date-7d}}`, `{{date+1d}}` et `{{today}}`.

**Saisie** : `{{VALUE:libellé}}` ouvre une invite intitulée *libellé*. Un même libellé garde la même valeur dans toute l'action ; dans un [enchaînement](/fr/concepts/chain/), la valeur reste disponible pour les étapes suivantes.

**Globales** : `{{GLOBAL:nom}}`, voir plus bas.

## Contextes emboîtés : `{{date}}` et `{{note}}`

Deux variables avaient déjà deux sens avant la version 0.5.0. Elles les gardent, pour que les extractions existantes ne changent pas. Le contexte le plus proche l'emporte.

Dans le **gabarit de ligne**, qui décrit un commentaire, `{{date}}` et `{{date:FORMAT}}` désignent la date du commentaire, et `{{note}}` le lien vers la note source.

**Partout ailleurs** (nom de la note, gabarit, texte de départ d'une annotation), `{{date}}` est la date du jour et `{{note}}` le nom de la note ou du dossier.

`{{today}}` et `{{today:FORMAT}}` désignent toujours la date du jour, quel que soit le contexte. `{{date-7d}}` et `{{date+1d}}` sont toujours calculés depuis aujourd'hui. Dans le doute, écrivez `{{today}}`.

## Variables globales

Les variables globales sont des valeurs nommées, réutilisables d'une action à l'autre. On les définit dans la section *Variables globales* des réglages, sous forme d'une liste de lignes nom / valeur :

| Nom | Valeur |
|---|---|
| `lecteur` | `F. Ernotte` |
| `dossier-revue` | `Revues` |
| `nom-revue` | `Revue {{today:YYYY-[S]WW}}` |

On écrit ensuite `{{GLOBAL:dossier-revue}}` dans le dossier d'une extraction, ou `{{GLOBAL:lecteur}}` dans un gabarit. Une valeur peut elle-même contenir des variables, comme `nom-revue` ci-dessus.
