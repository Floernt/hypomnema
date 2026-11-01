---
title: Annoter par catégories
description: Se forger sa propre taxinomie de lecture.
sidebar:
  order: 1
---

:::caution[Brouillon — section à réécrire par l'auteur]
« L'idée » et « Un exemple vécu » sont un brouillon.
:::

## L'idée

Une catégorie dit quel genre de pensée un commentaire contient : une idée, une question, un doute, une citation à garder. Choisir la catégorie au moment d'écrire oblige à une petite décision sur sa propre réaction au texte. Avec le temps, la liste des catégories décrit la manière dont on lit, et la modifier modifie la manière de lire.

## Un exemple vécu

À la lecture de *Pourquoi on oublie ce qu'on lit*, le passage sur la courbe de l'oubli reçoit une « Idée » : annoter pendant la lecture, pas après. La mention de la note de Fermat dans la marge de Diophante reçoit « À vérifier », car la formulation doit être contrôlée avant d'être citée. Un doute sur les commentaires posés au curseur reçoit une « Question ». Trois catégories, trois suites différentes : une idée à développer, une source à vérifier, un essai à faire.

## Le réglage

Les catégories se règlent dans *Paramètres → Hypomnema → Catégories*. Chacune a un nom, une couleur et un tag. Un premier jeu pourrait être :

| Nom | Couleur | Tag |
|---|---|---|
| Idée | vert | `idee` |
| Question | bleu | `question` |
| À vérifier | orange | `a-verifier` |
| Citation | violet | `citation` |

Quand un commentaire reçoit une catégorie, le tag est ajouté à la propriété `tags` de la note. Il est retiré quand plus aucun commentaire de cette catégorie n'y figure, sauf si la note portait déjà ce tag. Un commentaire peut aussi rester sans catégorie.

![Réglages des catégories : nom, couleur et tag](/screenshots/06-settings-fr.png)

## Variantes

**Moins de catégories.** Deux suffisent pour commencer : « À garder » et « Doute ». N'en ajoutez une troisième que lorsque vous remarquez que vous écrivez souvent le même genre de commentaire.

**Des catégories par suite à donner.** Nommez les catégories d'après ce que vous ferez du commentaire plutôt que d'après ce qu'il est : « À écrire », « À vérifier », « À discuter ». L'[extraction en Kanban](/fr/concepts/extraction/) donne alors une colonne par action.

**Des tags partagés.** Reprenez des tags qui existent déjà dans le coffre, comme `projet/x` : les notes commentées apparaissent alors à côté des autres notes sur le même sujet.

**L'extraction par catégorie.** À partir de la version 0.5.0, une [extraction](/fr/concepts/extraction/) peut ne garder que certaines catégories, par exemple pour une liste « à vérifier » sur tout le coffre.
