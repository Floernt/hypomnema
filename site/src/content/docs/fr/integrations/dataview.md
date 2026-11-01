---
title: Dataview
description: Interroger les notes d'extraction et les commentaires avec Dataview.
sidebar:
  order: 1
---

[Dataview](https://blacksmithgu.github.io/obsidian-dataview/) n'est pas nécessaire. Hypomnema ne cherche pas à être un tableau de bord : il écrit du texte brut, des propriétés et des tâches que Dataview sait déjà lire. Les recettes ci-dessous supposent qu'au moins une extraction a eu lieu (*Extraire les commentaires de cette note*, ou clic droit sur un dossier → *Extraire les commentaires de ce dossier*).

## Le contenu d'une note d'extraction

```markdown
---
hypomnema-extract: true
hypomnema-source:
  - "[[Pourquoi on oublie ce qu'on lit]]"
hypomnema-date: 2026-10-31
tags:
  - idee
  - a-verifier
kanban-plugin: board        # format Kanban uniquement
---

## Idée

- [ ] Texte du commentaire — « passage cité » [↩](obsidian://hypomnema?vault=…&file=…&id=a1)
```

Les propriétés permettent de retrouver la note avec `WHERE hypomnema-extract`. Le lien ↩ rouvre la note source et sélectionne le passage commenté. Il identifie aussi le commentaire : lors d'une nouvelle extraction en mode *N'ajouter que les nouveaux commentaires*, un commentaire dont le lien figure déjà dans la note est ignoré, où que vous l'ayez déplacé.

## Recette minimale : lister les notes d'extraction

````markdown
```dataview
TABLE dateformat(hypomnema-date, "yyyy-MM-dd") AS "Extraite le", length(hypomnema-source) AS "Notes", tags AS "Catégories"
WHERE hypomnema-extract
SORT hypomnema-date DESC
```
````

![Un tableau de bord Dataview qui liste les notes d'extraction et tous les commentaires du coffre](/screenshots/11-dataview-dashboard-fr.png)

## Ce qui reste à traiter, tous tableaux confondus

Les cartes Kanban et les éléments de liste sont des tâches ordinaires : Dataview peut les interroger.

````markdown
```dataview
TASK
WHERE hypomnema-extract AND !completed
GROUP BY file.link
```
````

## Variante : tous les commentaires du coffre, sans extraction

Cette requête DataviewJS lit directement le bloc `%% annotations` de chaque note, selon le [format de stockage](/fr/advanced/storage-format/). Elle demande d'activer *Enable JavaScript queries* dans les réglages de Dataview.

````markdown
```dataviewjs
const ENTRY = /^\[(a\d+)\]\s+(\d{4}-\d{2}-\d{2})(?: #([^\s#]+))?(?: (.*))?$/;
const rows = [];
for (const page of dv.pages()) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  const text = await app.vault.cachedRead(file);
  const block = text.match(/^%% annotations[ \t]*\n([\s\S]*?)^%%[ \t]*$/m);
  if (!block) continue;
  for (const line of block[1].split("\n")) {
    const m = ENTRY.exec(line);
    if (m && m[4]) rows.push([page.file.link, m[3] ? "#" + m[3] : "", m[2], m[4]]);
  }
}
rows.sort((a, b) => b[2].localeCompare(a[2]));
dv.table(["Note", "Catégorie", "Date", "Commentaire"], rows);
```
````

Seule la première ligne de chaque commentaire s'affiche, sans les réponses. Un filtre dans la boucle (par exemple `if (m[3] !== "a-verifier") continue;`) donne une liste « à vérifier ».

## Variante : par l'API

:::note
Disponible à partir de la version 0.5.0.
:::

L'[API publique](/fr/advanced/api/) lit les fils à votre place, réponses comprises, et filtre par dossier, catégorie et date :

````markdown
```dataviewjs
const api = app.plugins.plugins.hypomnema?.api;
if (!api) { dv.paragraph("Hypomnema n'est pas activé."); }
else {
  const since = moment().subtract(30, "days").format("YYYY-MM-DD");
  const items = await api.allThreads({ categories: ["a-verifier"], since });
  dv.table(["Note", "Date", "Commentaire", "Réponses"],
    items.map(({ file, thread }) =>
      [dv.fileLink(file.path), thread.root.date, thread.root.text, thread.replies.length]));
}
```
````

Un `thread` contient le commentaire racine (`thread.root`, avec `date`, `tag` et `text`), ses réponses (`replies`) et le passage commenté (`thread.quote`). Voir la page [API](/fr/advanced/api/).
