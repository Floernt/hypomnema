---
title: Annotation
description: Une action qui ouvre un commentaire avec une catégorie et un texte de départ préréglés.
sidebar:
  order: 3
---

:::note
Disponible à partir de la version 0.5.0.
:::


![L'action Objection : la rédaction s'ouvre avec la catégorie Question choisie et le texte prérempli.](/screenshots/14-action-annotation-fr.png)

Une action de type Annotation se comporte comme la commande *Commenter la sélection ou le curseur*, à deux différences près : la rédaction s'ouvre avec la catégorie choisie, et le champ est prérempli par un texte de départ.

```ts
interface AnnotationAction extends ActionBase {
  kind: "annotation";
  category: string | "ask" | "";
  initialText: string;
}
```

## Catégorie

Le champ « Catégorie » reçoit l'une de vos catégories, ou l'une de deux valeurs particulières. « Demander à chaque fois » (`"ask"`) affiche un sélecteur de catégorie avant l'ouverture de la rédaction. « Aucune » (`""`) crée le commentaire sans catégorie.

## Texte de départ

Le *Texte de départ* peut contenir des [variables](/fr/concepts/variables/), résolues au lancement de l'action. Le curseur se place à `{{cursor}}` si le texte le contient, à la fin sinon. Une variable `{{VALUE:libellé}}` demande une valeur avant l'ouverture de la rédaction.

## Deux exemples

Ils sont donnés à titre d'exemple ; le plugin ne les crée pas.

| Nom | Catégorie | Texte de départ |
|---|---|---|
| Objection | `#objection` | `Objection : ` |
| À vérifier | `#a-verifier` | `Vérifier {{VALUE:quoi ?}}` |

Le premier ouvre une rédaction dans la catégorie « Objection », prête à recevoir l'argument. Le second demande ce qu'il faut vérifier, puis écrit « Vérifier … » avec la réponse, de sorte que l'élément se lise bien une fois [extrait](/fr/concepts/extraction/).

La note de méthode [L'objection et la vérification](/fr/method/objection-verification/) montre ces deux actions à l'œuvre.
