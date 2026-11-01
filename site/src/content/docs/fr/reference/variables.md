---
title: Variables
description: Toutes les variables de la syntaxe {{…}}, avec leur champ d'application.
sidebar:
  order: 1
---

Les notions derrière cette table sont expliquées sur la page [Variables](/fr/concepts/variables/). Une variable inconnue est laissée telle quelle.

## Disponibles dès maintenant

| Variable | Où | Valeur |
|---|---|---|
| `{{text}}` | Gabarit de ligne | Texte du commentaire |
| `{{quote}}` | Gabarit de ligne | Passage commenté, ou contexte autour d'un commentaire au curseur |
| `{{tag}}` | Gabarit de ligne | Tag de la catégorie |
| `{{category}}` | Gabarit de ligne | Nom de la catégorie |
| `{{date}}` | Gabarit de ligne | Date du commentaire |
| `{{date}}` | Nom de la note | Date du jour |
| `{{note}}` | Gabarit de ligne | Lien vers la note source |
| `{{note}}` | Nom de la note | Nom de la note ou du dossier |
| `{{link}}` | Gabarit de ligne | Lien de retour ↩ vers le passage |
| `{{id}}` | Gabarit de ligne | Identifiant du commentaire (`a1`) |

## À partir de la version 0.5.0

| Variable | Où | Valeur |
|---|---|---|
| `{{date:FORMAT}}` | Partout | `{{date}}` dans un [format Moment.js](https://momentjs.com/docs/#/displaying/format/) ; date du commentaire dans le gabarit de ligne, du jour ailleurs |
| `{{today}}` | Partout | Date du jour (AAAA-MM-JJ) |
| `{{today:FORMAT}}` | Partout | Date du jour dans un format Moment.js |
| `{{date-7d}}`, `{{date+1d}}` | Partout | Aujourd'hui moins ou plus N jours |
| `{{note}}` | Gabarit, annotation | Nom de la note ou du dossier |
| `{{selection}}` | Annotation, gabarit | Texte sélectionné |
| `{{cursor}}` | Annotation | Position du curseur dans le texte de départ |
| `{{sources}}` | Gabarit | Liens vers les notes sources |
| `{{comments}}` | Gabarit | Corps de l'extraction |
| `{{VALUE:libellé}}` | Partout | Valeur saisie dans une invite intitulée *libellé* ; même libellé, même valeur dans une action ou un enchaînement |
| `{{GLOBAL:nom}}` | Partout | Valeur de la [variable globale](/fr/concepts/variables/#variables-globales) *nom* |

Les décalages de date sont toujours calculés depuis aujourd'hui, y compris dans le gabarit de ligne.
