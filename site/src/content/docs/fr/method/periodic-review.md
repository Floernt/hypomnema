---
title: La revue périodique
description: Une extraction filtrée sur les sept derniers jours, vers un tableau Kanban.
sidebar:
  order: 4
---

:::note
Disponible à partir de la version 0.5.0.
:::

:::caution[Brouillon — section à réécrire par l'auteur]
« L'idée » et « Un exemple vécu » sont un brouillon.
:::

## L'idée

Un commentaire ne vaut que si l'on y revient. Revenir sur chaque lecture séparément arrive rarement ; revenir une fois par semaine sur tout ce qui a été écrit dans la semaine est une habitude qui tient. La revue réunit les commentaires de la semaine dans un seul tableau, où chaque carte est traitée, reportée ou écartée.

## Un exemple vécu

Le vendredi, l'action « Revue hebdomadaire » rassemble les commentaires de la semaine dans tout le coffre. La colonne « À vérifier » contient la note de Fermat tirée de *Pourquoi on oublie ce qu'on lit* ; la source est vérifiée et la carte passe dans *Fait*. La « Question » sur les commentaires au curseur reste où elle est. Un fil ancien, issu d'une lecture d'il y a trois semaines, revient parce qu'une réponse y a été ajoutée mardi.

## Le réglage

Créez une action [Extraction](/fr/concepts/extraction/) nommée « Revue hebdomadaire » :

| Champ | Valeur |
|---|---|
| Portée | Tout le coffre |
| Catégories | vide (toutes) |
| Actifs depuis | `{{date-7d}}` |
| Inclure les réponses | oui |
| Format | Tableau Kanban |
| Dossier | `Revues` |
| Nom de la note | `Revue {{today:YYYY-[S]WW}}` |
| Si la note existe déjà | N'ajouter que les nouveaux commentaires |

*Actifs depuis* retient un fil dont la date la plus récente, racine ou réponse, tombe dans les sept derniers jours : un fil relancé par une réponse revient donc. Le nom de la note change chaque semaine, si bien que chaque semaine a son tableau ; lancer l'action deux fois dans la même semaine n'ajoute que les nouveaux commentaires.

## Variantes

**Un tableau continu.** Avec un nom de note fixe, `Revue`, on garde un seul tableau qui grandit ; les cartes traitées passent dans *Fait* et s'archivent avec le plugin Kanban.

**Une revue par catégorie.** Filtrez sur `a-verifier` seulement, pour une séance hebdomadaire de vérification.

**Une revue par projet.** Réglez la portée sur *Un dossier donné*, avec le dossier du projet. Ou activez *Dans le menu des dossiers* (sous *Plus d'options*) et lancez-la d'un clic droit sur n'importe quel dossier : le dossier cliqué remplace alors la portée.

**Avec Dataview.** Listez les tableaux de revue avec la requête de la page [Dataview](/fr/integrations/dataview/), triés par `hypomnema-date`.
