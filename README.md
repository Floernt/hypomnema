# Hypomnema

*[English](#english) · [Français](#français)*

## English

Hypomnema is an Obsidian plugin for augmented reading, reflection and knowledge organisation. Comment on a passage, or on a precise point, of any note. Write, reply and navigate in a side panel, much like the comments pane in Word. Classify your comments into coloured categories linked to tags. It works especially well with articles saved through the Web Clipper: the source text and your remarks never get mixed up.

Comments are stored as plain text inside the note itself. They are searchable, they sync with the rest of your vault, and they remain readable without the plugin.

> The plugin's interface is currently in French. An English interface is planned.

### Usage

- **Comment**: select a passage, or just place the cursor, then right-click (*Commenter la sélection* / *Commenter ici*) or use the command palette. For speed, assign a hotkey to the command *Commenter la sélection ou le curseur* in *Settings → Hotkeys*; Ctrl+Alt+M, the Word shortcut, works well. You write in the right-hand panel, so the text stays visible. Ctrl+Enter saves and Esc cancels.
- **Categories**: while writing, pick a category (a coloured chip). It colours the passage and adds its tag to the note's properties. Categories (name, colour, tag) are set in *Settings → Hypomnema*.
- **In the note**: a commented passage is underlined, and a comment placed at the cursor shows as a small bubble. Click either one to open its thread in the panel.
- **Panel**: a *Commentaires* tab sits in the right sidebar, next to backlinks, outgoing links and the outline. It lists the note's comments in text order; click one to jump to its passage.
- **Reply / edit / delete**: each thread offers these actions. Deleting a comment removes its markers and leaves the source text untouched. Ctrl+Z undoes.
- **Search**: comments are text in the note, so Obsidian's search finds them across the vault. Category tags live in the note's properties and work with `tag:#…`, the tags pane and Dataview.

#### Automatic tags

When a comment gets a category, its tag is added to the note's `tags` property. The tag is removed when no comment of that category remains, unless the note already had that tag before. The plugin keeps track of the tags it added in its `data.json`.

### Storage format (for scripts)

A commented passage is wrapped in two Obsidian comments that share an id. A comment placed at the cursor is an empty anchor:

```text
The author argues that %%[a1%%memory is a reconstruction%%a1]%% rather than a recording.
A comment placed here %%[a2%%%%a2]%% without a selection.
```

The comment texts live in a single block at the end of the note:

```text
%% annotations
[a1] 2026-10-31 #idea First comment
    continued (indented continuation lines)
  [a1.1] 2026-11-04 Reply to comment a1
[a2] 2026-10-31 Comment without a category
%%
```

- A root comment has the id `aN`; its replies are `aN.k`, indented by two spaces.
- Each entry starts with `[id] YYYY-MM-DD`. An optional `#tag` (the category, root comments only) can follow, then the text. Indented lines that follow continue the entry.
- An uncategorised text that starts with `#` is written as `\#…`.
- `%%` is hidden in reading view, so the note stays clean without the plugin.
- Regex for a commented passage: `%%\[(a\d+)%%([\s\S]*?)%%\1\]%%`. For a cursor comment, group 2 is empty.
- A comment whose markers were deleted stays in the block. The panel flags it as orphaned.

### Limitations

The plugin works in Live Preview only. In reading view the markers are hidden, but passages are not underlined. Threads have a single level of replies, and each comment has a single category.

### Installation

Until the plugin is listed in the community directory, download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Floernt/hypomnema/releases/latest). Put them in `<vault>/.obsidian/plugins/hypomnema/`, then enable the plugin under *Community plugins*.

---

## Français

Hypomnema est un outil de lecture augmentée, de réflexion et d'organisation de la connaissance. Il permet de commenter un passage ou un point précis d'une note. On rédige, on répond et on navigue dans un panneau latéral, comme le volet des commentaires de Word. Les commentaires se classent par catégories de couleur reliées à des tags. Il convient particulièrement aux articles capturés avec le Web Clipper : le texte source et vos remarques ne se mélangent jamais.

Les commentaires restent du texte brut dans la note : ils sont cherchables, synchronisables et lisibles sans le plugin.

### Utilisation

- **Commenter** : sélectionnez un passage, ou placez simplement le curseur, puis faites un clic droit (« Commenter la sélection » ou « Commenter ici ») ou passez par la palette de commandes. Pour aller plus vite, attribuez un raccourci à la commande *Commenter la sélection ou le curseur* dans *Paramètres → Raccourcis* : Ctrl+Alt+M, celui de Word, est un bon choix. La rédaction s'ouvre dans le panneau de droite, sans masquer le texte. Ctrl+Entrée enregistre, Échap annule.
- **Catégories** : au moment de rédiger, vous pouvez choisir une catégorie (une pastille de couleur). Elle colore le passage et ajoute son tag aux propriétés de la note. Les catégories se règlent dans *Paramètres → Hypomnema* (nom, couleur, tag).
- **Dans la note** : un passage commenté est souligné, et un commentaire posé au curseur s'affiche comme une petite bulle. Un clic sur l'un ou l'autre ouvre le fil dans le panneau.
- **Panneau** : un onglet « Commentaires » est ajouté dans la barre de droite, à côté des rétroliens, des liens sortants et du plan. Il liste les commentaires de la note dans l'ordre du texte. Un clic ramène au passage.
- **Répondre / modifier / supprimer** : ces actions se trouvent sur chaque fil. Supprimer un commentaire retire ses marqueurs et laisse le texte source intact. Ctrl+Z annule.
- **Recherche** : les commentaires étant du texte dans la note, la recherche d'Obsidian les trouve dans tout le coffre. Les tags de catégorie, eux, figurent dans les propriétés et fonctionnent avec `tag:#…`, le volet des tags et Dataview.

#### Tags automatiques

Quand un commentaire reçoit une catégorie, le tag correspondant est ajouté à la propriété `tags` de la note. Il est retiré quand plus aucun commentaire de cette catégorie n'y figure, sauf si la note portait déjà ce tag avant. Pour faire la différence, le plugin garde dans `data.json` la liste des tags qu'il a lui-même ajoutés.

### Format (pour les scripts)

Le format est décrit dans la [section anglaise](#storage-format-for-scripts) et vaut à l'identique ici. Le passage commenté est délimité par `%%[aN%%…%%aN]%%` ; un commentaire au curseur est une ancre vide `%%[aN%%%%aN]%%`. Le texte des commentaires se trouve dans un bloc `%% annotations … %%` en fin de note, avec une entrée par commentaire : `[aN] AAAA-MM-JJ #tag texte`, les réponses `[aN.k]` étant indentées.

### Limites

Le plugin fonctionne uniquement en Aperçu en direct : en mode lecture, les marqueurs sont masqués, mais le passage n'est pas souligné. Les fils ne comptent qu'un niveau de réponse, et chaque commentaire n'a qu'une catégorie.

### Installer le plugin

En attendant la publication dans le catalogue communautaire, téléchargez `main.js`, `manifest.json` et `styles.css` depuis la [dernière release](https://github.com/Floernt/hypomnema/releases/latest). Copiez-les dans `<coffre>/.obsidian/plugins/hypomnema/`, puis activez le plugin dans *Modules complémentaires*.

---

## Development / Développement

```bash
npm install
npm test          # format tests / tests du format (vitest)
npm run build     # build + copy into test-vault/.obsidian/plugins/
npm run dev       # watch mode / compilation continue
```

`test-vault/` is a sample vault for manual testing. / `test-vault/` est un coffre d'essai.

### Releasing / Publier une version

The version history, including every change to the storage format, is kept in [CHANGELOG.md](CHANGELOG.md).

1. Move the `[Non publié]` entries under a new, dated version number.
2. Set that number in `manifest.json` and `package.json`, and add it to `versions.json` with its `minAppVersion`.
3. Run `npm test`, then `npm run build`.
4. Create a GitHub release whose tag is exactly that number (no `v`), with `main.js`, `manifest.json` and `styles.css` attached.

## License / Licence

MIT. See [LICENSE](LICENSE).
