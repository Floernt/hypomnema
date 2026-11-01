# Recipes: Dataview, Kanban, QuickAdd / Recettes

*[English](#english) · [Français](#français)*

## English

Hypomnema does not try to be a dashboard. It writes plain text that other plugins already know how to read. The recipes below assume you have extracted comments at least once (*Extract comments from this note*, or right-click a folder → *Extract comments from this folder*).

### What an extraction note contains

```markdown
---
hypomnema-extract: true
hypomnema-source:
  - "[[Why we forget what we read]]"
hypomnema-date: 2026-10-31
tags:
  - idea
  - to-verify
kanban-plugin: board        # Kanban format only
---

## Idea

- [ ] Comment text — “quoted passage” [↩](obsidian://hypomnema?vault=…&file=…&id=a1)
```

- The properties make the note easy to find with Dataview: `WHERE hypomnema-extract`.
- The ↩ link reopens the source note and selects the commented passage.
- The link also identifies the comment: when you extract again with *Add only new comments*, a comment whose link is already in the note is skipped, wherever you moved it.

### Dataview: list your extraction notes

````markdown
```dataview
TABLE dateformat(hypomnema-date, "yyyy-MM-dd") AS "Extracted", length(hypomnema-source) AS "Notes", tags AS "Categories"
WHERE hypomnema-extract
SORT hypomnema-date DESC
```
````

### Dataview: open items across every board

Kanban cards and list items in Kanban format are ordinary tasks, so Dataview (and the Tasks plugin) can query them:

````markdown
```dataview
TASK
WHERE hypomnema-extract AND !completed
GROUP BY file.link
```
````

### DataviewJS: every comment in the vault, without extracting

This reads the `%% annotations` block of each note directly, using the [storage format](../README.md#storage-format-for-scripts). It requires *Enable JavaScript queries* in Dataview's settings.

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
dv.table(["Note", "Category", "Date", "Comment"], rows);
```
````

Only the first line of each comment is shown, and replies are left out. Add `WHERE`-style filters in the loop (for instance `if (m[3] !== "to-verify") continue;`) to build a "to verify" list.

### Kanban: a review board per reading

Set *Format* to *Kanban board* in *Settings → Hypomnema*. Each category becomes a column, plus an empty *Done* column. Move a card to *Done* once you have dealt with the comment: written the note, checked the source, answered the question. Extracting again later only adds the comments written since, in their category's column.

### QuickAdd: extract at the end of a reading

QuickAdd can chain the extraction with your own steps:

1. In QuickAdd's settings, create a *Macro* choice, for example "End of reading".
2. Add an *Obsidian command* step: **Hypomnema: Extract comments from this note**.
3. Add the steps you want after it, for instance a *Capture* to a "Reading log" note with the format `- {{DATE}} [[{{LINKCURRENT}}]]`.
4. Enable the macro's command (the lightning icon) to run it from the command palette or a hotkey.

The same command is available to any plugin or script: `app.commands.executeCommandById("hypomnema:extract-note")`.

---

## Français

Hypomnema ne cherche pas à être un tableau de bord. Il écrit du texte brut que d'autres plugins savent déjà lire. Les recettes ci-dessous supposent qu'au moins une extraction a eu lieu (*Extraire les commentaires de cette note*, ou clic droit sur un dossier → *Extraire les commentaires de ce dossier*).

### Le contenu d'une note d'extraction

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

- Les propriétés permettent de retrouver la note avec Dataview : `WHERE hypomnema-extract`.
- Le lien ↩ rouvre la note source et sélectionne le passage commenté.
- Le lien identifie aussi le commentaire : lors d'une nouvelle extraction en mode *N'ajouter que les nouveaux commentaires*, un commentaire dont le lien figure déjà dans la note est ignoré, où que vous l'ayez déplacé.

### Dataview : lister les notes d'extraction

````markdown
```dataview
TABLE dateformat(hypomnema-date, "yyyy-MM-dd") AS "Extraite le", length(hypomnema-source) AS "Notes", tags AS "Catégories"
WHERE hypomnema-extract
SORT hypomnema-date DESC
```
````

### Dataview : ce qui reste à traiter, tous tableaux confondus

Les cartes Kanban et les éléments de liste au format Kanban sont des tâches ordinaires : Dataview (et le plugin Tasks) peuvent les interroger.

````markdown
```dataview
TASK
WHERE hypomnema-extract AND !completed
GROUP BY file.link
```
````

### DataviewJS : tous les commentaires du coffre, sans extraction

Cette requête lit directement le bloc `%% annotations` de chaque note, selon le [format de stockage](../README.md#storage-format-for-scripts). Elle demande d'activer *Enable JavaScript queries* dans les réglages de Dataview.

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

### Kanban : un tableau de relecture par lecture

Choisissez le format *Tableau Kanban* dans *Paramètres → Hypomnema*. Chaque catégorie devient une colonne, plus une colonne *Fait*, vide au départ. Déplacez une carte dans *Fait* quand le commentaire a été traité : la note rédigée, la source vérifiée, la question tranchée. Une extraction ultérieure n'ajoute que les commentaires écrits depuis, dans la colonne de leur catégorie.

### QuickAdd : extraire en fin de lecture

QuickAdd peut enchaîner l'extraction avec vos propres étapes :

1. Dans les réglages de QuickAdd, créez un choix *Macro*, par exemple « Fin de lecture ».
2. Ajoutez une étape *Obsidian command* : **Hypomnema: Extraire les commentaires de cette note**.
3. Ajoutez ensuite les étapes voulues, par exemple une *Capture* vers une note « Journal de lecture » au format `- {{DATE}} [[{{LINKCURRENT}}]]`.
4. Activez la commande de la macro (l'icône éclair) pour la lancer depuis la palette ou un raccourci.

La même commande est accessible à tout plugin ou script : `app.commands.executeCommandById("hypomnema:extract-note")`.
