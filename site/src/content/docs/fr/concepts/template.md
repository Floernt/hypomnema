---
title: Gabarit
description: Une note du coffre qui sert de squelette à une note d'extraction.
sidebar:
  order: 5
---

:::note
Disponible à partir de la version 0.5.0.
:::

Un gabarit est une note ordinaire du coffre, par exemple `Gabarits/Revue de lecture.md`, qu'une [Extraction](/fr/concepts/extraction/) prend pour squelette de la note qu'elle crée. On indique son chemin dans le champ *Note-gabarit* (l'extension `.md` est facultative). Il contient du texte libre et des [variables](/fr/concepts/variables/), dont deux que seuls les gabarits connaissent :

- `{{comments}}` est le corps de l'extraction : les commentaires, dans le format choisi ;
- `{{sources}}` est une liste de liens vers les notes sources.

```markdown
---
statut: brouillon
tags:
  - revue
---
# Revue de {{note}}, {{today}}

Sources : {{sources}}

{{comments}}

## Ce que j'en retiens

```

## Règles

Un gabarit vaut pour les formats liste et tableau. Le format Kanban l'ignore, et le formulaire le signale : la structure qu'attend le plugin Kanban est trop stricte pour y mêler du texte libre.

Quand l'extraction n'ajoute que les nouveaux commentaires (*N'ajouter que les nouveaux commentaires*), le gabarit ne sert qu'une fois, à la création de la note. Les extractions suivantes écrivent les nouveaux commentaires dans la note existante, entre les repères décrits plus bas.

Les propriétés du gabarit sont conservées. Hypomnema y ajoute `hypomnema-extract`, `hypomnema-source` et `hypomnema-date`, et fusionne ses tags avec ceux du gabarit, sans doublon.

## Repères

`{{comments}}` est rendu entre deux commentaires Obsidian invisibles :

```markdown
%% hypomnema:start %%
…commentaires…
%% hypomnema:end %%
```

Les extractions suivantes en mode *N'ajouter que les nouveaux commentaires* n'écrivent qu'entre ces deux repères : le texte écrit après le bloc (ici, « Ce que j'en retiens ») reste en place. Si les repères ont été supprimés, les nouveaux commentaires s'ajoutent en fin de note. Ces repères ne concernent que la note d'extraction ; ils ne touchent pas au [format de stockage](/fr/advanced/storage-format/) des commentaires.

La note de méthode [De la lecture à l'écriture](/fr/method/reading-to-writing/) se sert d'un gabarit comme premier jet de note.
