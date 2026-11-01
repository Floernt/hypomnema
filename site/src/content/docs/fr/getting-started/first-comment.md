---
title: Premier commentaire
description: Commenter un passage, choisir une catégorie, répondre, retrouver ses commentaires.
sidebar:
  order: 2
---

Ouvrez une note en Aperçu en direct. Un article du web capturé avec l'[Obsidian Web Clipper](https://obsidian.md/clipper) est un bon point de départ : le texte source et vos remarques ne se mélangeront jamais.

## Rédiger le commentaire

Sélectionnez un passage, ou placez simplement le curseur, puis faites un clic droit et choisissez « Commenter la sélection » ou « Commenter ici ». La commande *Commenter la sélection ou le curseur* est aussi accessible depuis la palette. Pour aller plus vite, attribuez-lui un raccourci dans *Paramètres → Raccourcis* : Ctrl+Alt+M, celui de Word, est un bon choix.

La rédaction s'ouvre dans le panneau « Commentaires », à droite, sans masquer le texte. Choisissez au besoin une catégorie (une pastille de couleur), écrivez, puis Ctrl+Entrée. Échap annule.

## Ce qui se passe dans la note

Le passage est désormais souligné dans la couleur de sa catégorie. Un commentaire posé au curseur, sans sélection, s'affiche comme une petite bulle. Un clic sur l'un ou l'autre ouvre le fil dans le panneau. Le tag de la catégorie est ajouté à la propriété `tags` de la note ; il est retiré quand plus aucun commentaire de cette catégorie n'y figure, sauf si vous l'aviez posé vous-même.

## Répondre, modifier, supprimer

Chaque fil du panneau propose « Répondre », « Modifier » et « Supprimer ». Supprimer un commentaire retire ses marqueurs et laisse le texte source intact. Ctrl+Z annule.

## Le retrouver

Les commentaires sont du texte dans la note : la recherche d'Obsidian les trouve dans tout le coffre. Les tags de catégorie fonctionnent avec `tag:#…`, le volet des tags et Dataview.

Le plugin fonctionne en Aperçu en direct. En mode lecture, les marqueurs sont masqués, mais les passages ne sont pas soulignés. Les fils ne comptent qu'un niveau de réponse, et chaque commentaire n'a qu'une catégorie.

## Ensuite

[Faire la visite](/fr/getting-started/tour/), ou définir [vos propres catégories](/fr/method/categories/).
