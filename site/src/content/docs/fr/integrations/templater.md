---
title: Templater
description: Exécuter des balises Templater dans les gabarits d'extraction, ou appeler l'API depuis un modèle Templater.
sidebar:
  order: 4
---

:::note
Disponible à partir de la version 0.5.0.
:::

[Templater](https://silentvoid13.github.io/Templater/) n'est pas nécessaire. Les [variables](/fr/concepts/variables/) d'Hypomnema couvrent les dates, les noms, les saisies et les valeurs globales. Templater ajoute ce qu'elles ne font pas : du JavaScript dans un modèle, et sa propre bibliothèque de fonctions.

## Ce qu'il apporte

Quand une note d'extraction est créée à partir d'un [gabarit](/fr/concepts/template/), Templater peut exécuter les balises `<% … %>` de ce gabarit. On peut alors calculer une valeur, poser une question avec une liste de choix, ou déplacer la note une fois créée.

## Recette minimale : des balises Templater dans un gabarit d'extraction

1. Activez Templater.
2. Dans une action [Extraction](/fr/concepts/extraction/) dotée d'un gabarit, ouvrez *Plus d'options* et activez *Passer par Templater*. L'option est désactivée par défaut, et n'apparaît que si Templater est actif. L'extraction par défaut offre la même option derrière le bouton *Plus d'options* de la section *Extraction*.
3. Ajoutez des balises Templater au gabarit :

```markdown
# {{note}}

Auteur : <% await tp.system.prompt("Auteur") %>
Lu le {{today}}

{{comments}}
```

Hypomnema résout d'abord ses propres variables `{{…}}`, crée la note, puis la passe à Templater, qui exécute les balises `<% … %>`.

## Variante : l'API depuis un modèle Templater

Tout modèle Templater peut atteindre Hypomnema par `tp.app`. Celui-ci insère le nombre de commentaires de la note active :

```markdown
<%*
const api = tp.app.plugins.plugins.hypomnema?.api;
const file = tp.app.workspace.getActiveFile();
const threads = api && file ? await api.threads(file) : [];
tR += `${threads.length} commentaire(s)`;
%>
```

Voir l'[API](/fr/advanced/api/) pour les autres fonctions.
