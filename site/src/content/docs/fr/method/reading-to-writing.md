---
title: De la lecture à l'écriture
description: Un gabarit d'extraction qui sert de premier jet de note.
sidebar:
  order: 5
---

:::note
Disponible à partir de la version 0.5.0.
:::

:::caution[Brouillon — section à réécrire par l'auteur]
« L'idée » et « Un exemple vécu » sont un brouillon.
:::

## L'idée

Les commentaires écrits pendant la lecture sont déjà des débuts de texte. Ce qui manque, c'est le passage des remarques éparses à une page que l'on écrit. Le gabarit donne à cette page son cadre : les commentaires au milieu, et autour, les rubriques que l'on remplira soi-même. L'extraction prépare la matière ; l'écriture reste la sienne.

## Un exemple vécu

Après *Pourquoi on oublie ce qu'on lit*, le geste « Note de lecture » crée `Notes/Pourquoi on oublie ce qu'on lit — note.md`. Les commentaires apparaissent sous « Matière », chacun avec son lien ↩ vers le passage. En dessous attendent les rubriques vides « Ce que je retiens » et « Ce que je conteste ». L'idée de l'annotation comme dialogue devient le premier paragraphe ; le commentaire à vérifier devient une phrase une fois la source contrôlée.

## Le réglage

Créez le gabarit `Gabarits/Note de lecture.md` :

```markdown
---
statut: brouillon
---
# {{note}}

Lu le {{today}}. Source : {{sources}}

## Matière

{{comments}}

## Ce que je retiens

## Ce que je conteste

```

Puis un geste [Extraction](/fr/concepts/extraction/) nommé « Note de lecture » :

| Champ | Valeur |
|---|---|
| Portée | Note active |
| Format | Liste par catégorie |
| Note-gabarit | `Gabarits/Note de lecture` |
| Dossier | `Notes` |
| Nom de la note | `{{note}} — note` |
| Gabarit de ligne | `{{text}} — « {{quote}} » {{link}}` |
| Si la note existe déjà | N'ajouter que les nouveaux commentaires |

Le gabarit ne sert qu'une fois, à la création de la note. Si l'on commente encore et qu'on relance le geste, les nouveaux commentaires s'écrivent à la fin de « Matière », entre les repères invisibles `hypomnema:start` et `hypomnema:end`, et ce que l'on a écrit en dessous reste intact. Voir [Gabarit](/fr/concepts/template/).

## Variantes

**Format tableau.** Pour une lecture riche en citations, le format *Tableau* met côte à côte le passage et le commentaire.

**Les seules citations.** Filtrez sur la catégorie `citation` pour obtenir une page de citations prêtes à l'emploi.

**Avec Templater.** Si Templater est actif, activez *Passer par Templater* sous *Plus d'options* et ajoutez des balises `<% … %>` au gabarit, par exemple pour demander le nom de l'auteur. Voir [Templater](/fr/integrations/templater/).
