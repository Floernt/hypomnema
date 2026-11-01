---
title: Gestes
description: Un geste est une action de lecture nommée, que l'on définit soi-même et que l'on lance comme une commande Obsidian.
sidebar:
  order: 2
---

:::note
Disponible à partir de la version 0.5.0.
:::


![La section Gestes des réglages : trois gestes, chacun devenu une commande.](/screenshots/12-gestes-settings-fr.png)

Un geste est une action de lecture que l'on définit soi-même, que l'on nomme et que l'on lance comme une commande Obsidian. Ce peut être une manière d'annoter, une manière d'extraire, ou un enchaînement des deux. Sans geste défini, le plugin se comporte exactement comme avant : les gestes s'ajoutent à l'usage courant, ils n'en sont jamais une condition.

## Les quatre types

| Type | Niveau | Rôle |
|---|---|---|
| [Annotation](/fr/concepts/annotation/) | 2 | Commenter avec une catégorie et un texte de départ préréglés. |
| [Extraction](/fr/concepts/extraction/) | 2 | Extraire selon une portée, un filtre, un format et un gabarit. |
| [Enchaînement](/fr/concepts/chain/) | 3 | Exécuter une suite d'étapes : gestes, commandes, scripts, pauses. |
| [Groupe](/fr/concepts/group/) | 3 | Ouvrir un menu qui regroupe d'autres gestes. |

Les enchaînements et les groupes n'apparaissent dans les réglages que si les *Fonctions avancées* sont activées. Ceux qui existent déjà restent exécutables quand l'interrupteur est coupé.

## Ce que tout geste possède

```ts
interface GesteBase {
  id: string;        // stable, généré à la création
  name: string;
  kind: "annotation" | "extraction" | "chain" | "group";
  command: boolean;  // exposé comme commande Obsidian
}
```

Quand l'option *Commande* est activée, le geste devient la commande `hypomnema:geste-<id>`. On peut alors lui attribuer un raccourci, le retrouver dans la palette, l'appeler depuis une macro QuickAdd (étape *Obsidian command*) ou le lancer par l'[URI](/fr/advanced/uri/). L'ajout ou la suppression d'un geste ajoute ou retire sa commande aussitôt, sans redémarrer Obsidian.

La commande *Lancer un geste* (`hypomnema:run-geste`) liste tous les gestes dans un menu avec recherche, qu'ils aient leur propre commande ou non. Elle est disponible dès qu'il existe au moins un geste.

## Où vivent les gestes

La section *Gestes* de *Paramètres → Hypomnema* les liste avec leur nom, leur type et l'option *Commande*, et des boutons pour monter, descendre, modifier ou supprimer chacun d'eux. « Ajouter un geste » ouvre un formulaire court : un nom, un type, puis les seuls champs utiles à ce type. Les champs facultatifs sont repliés sous *Plus d'options*. La section *Variables globales*, juste en dessous, accueille les [variables globales](/fr/concepts/variables/#variables-globales).

## Pour qui vient de QuickAdd

Hypomnema reprend le vocabulaire des choix de QuickAdd, mais l'applique à la seule annotation.

| QuickAdd | Hypomnema | Niveau |
|---|---|---|
| Choice | Geste | 2 |
| Capture | Annotation | 2 |
| Template | Extraction | 2 |
| Format syntax | Syntaxe des variables | 2 |
| Global variables | Variables globales | 2 |
| Template file | Gabarit | 2 |
| Macro | Enchaînement | 3 |
| Multi | Groupe | 3 |
| User scripts | Script | 3 |
| API | API publique | 3 |
| Obsidian URI | URI `obsidian://hypomnema?geste=…` | 3 |
| Packages | Export / import | 3 |

Il n'y a pas d'assistant IA : le commentaire reste écrit par le lecteur.
