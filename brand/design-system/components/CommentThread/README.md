# CommentThread

A card in the *Comments / Commentaires* panel: quoted passage, date, category, text, then one level of replies.

The consumer provides the quote (truncated at 160 characters, as the plugin does), the ISO date, the optional category and the text.

- Card on `paper-raised`, panel on `paper-sunk`, hairline `line`, left edge 3px in the category colour at 60%; full colour and `shadow-raised` when active.
- Quote in `quote` style (serif italic) and `ink-muted`; the comment itself in `ui`, `ink`.
- Dates stay ISO (`2026-10-28`), as in the storage format.
- Replies indent by `space-3` with a `line` rule; a single level only.
- Orphaned comment (markers deleted): `is-orphan`, rubric edge plus the word "Orphelin / Orphaned" in `hy-orphan-label`. Never colour alone.

---

Carte du panneau « Commentaires » : passage cité, date ISO, catégorie, texte, puis un seul niveau de réponses. Un commentaire orphelin porte le mot « Orphelin », pas seulement une couleur.
