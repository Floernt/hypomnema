# CategoryChip

A coloured dot plus the category name, used to pick a category in the composer; one can be selected at a time.

The consumer provides the name and a `hy-cat-*` class (or sets `--c` to the user's own category colour).

- The colour sits in the dot and the border only. The label stays in `ink`, so a category is always read by its name, never by hue alone.
- Selected: full-colour border, 18% tint, `ui-strong` weight.
- Use the `cat-*` tokens as defaults; users can change category colours in the plugin settings, so never hard-code meaning to a hue.
- "Aucune / None" has no colour: its dot uses `line-strong`.

---

Pastille de catégorie : un point de couleur et le nom. La couleur ne porte jamais seule l'information ; le libellé reste en `ink`.
