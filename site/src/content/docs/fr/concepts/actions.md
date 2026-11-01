---
title: Actions
description: Une action est une opération de lecture nommée, que l'on définit soi-même et que l'on lance comme une commande Obsidian.
sidebar:
  order: 2
---

:::note
Disponible à partir de la version 0.5.0.
:::


![La section Actions des réglages : trois actions, chacune devenue une commande.](/screenshots/12-actions-settings-fr.png)

Une action est une opération de lecture que l'on définit soi-même, que l'on nomme et que l'on lance comme une commande Obsidian. Ce peut être une manière d'annoter, une manière d'extraire, ou un enchaînement des deux. Sans action définie, le plugin se comporte exactement comme avant : les actions s'ajoutent à l'usage courant, elles n'en sont jamais une condition.

## Les quatre types

| Type | Niveau | Rôle |
|---|---|---|
| [Annotation](/fr/concepts/annotation/) | 2 | Commenter avec une catégorie et un texte de départ préréglés. |
| [Extraction](/fr/concepts/extraction/) | 2 | Extraire selon une portée, un filtre, un format et un gabarit. |
| [Enchaînement](/fr/concepts/chain/) | 3 | Exécuter une suite d'étapes : actions, commandes, scripts, pauses. |
| [Groupe](/fr/concepts/group/) | 3 | Ouvrir un menu qui regroupe d'autres actions. |

Les enchaînements et les groupes n'apparaissent dans les réglages que si les *Fonctions avancées* sont activées. Ceux qui existent déjà restent exécutables quand l'interrupteur est coupé.

## Ce que toute action possède

```ts
interface ActionBase {
  id: string;        // stable, généré à la création
  name: string;
  kind: "annotation" | "extraction" | "chain" | "group";
  command: boolean;  // exposé comme commande Obsidian
}
```

Quand l'option *Commande* est activée, l'action devient la commande `hypomnema:action-<id>`. On peut alors lui attribuer un raccourci, la retrouver dans la palette, l'appeler depuis une macro QuickAdd (étape *Obsidian command*) ou la lancer par l'[URI](/fr/advanced/uri/). L'ajout ou la suppression d'une action ajoute ou retire sa commande aussitôt, sans redémarrer Obsidian.

La commande *Lancer une action* (`hypomnema:run-action`) liste toutes les actions dans un menu avec recherche, qu'elles aient leur propre commande ou non. Elle est disponible dès qu'il existe au moins une action.

## Où sont stockées les actions ?

La section *Actions* de *Paramètres → Hypomnema* les liste avec leur nom, leur type et l'option *Commande*, et des boutons pour monter, descendre, modifier ou supprimer chacune d'elles. « Ajouter une action » ouvre un formulaire court : un nom, un type, puis les seuls champs utiles à ce type. Les champs facultatifs sont repliés sous *Plus d'options*. La section *Variables globales*, juste en dessous, accueille les [variables globales](/fr/concepts/variables/#variables-globales).

Les actions sont enregistrées dans les réglages du plugin, le fichier `.obsidian/plugins/hypomnema/data.json` du coffre, et non dans vos notes. Pour les copier d'un coffre à l'autre, passez par l'[export et l'import](/fr/advanced/export-import/).
