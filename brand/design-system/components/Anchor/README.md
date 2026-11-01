# Anchor

How a comment shows inside the text: a commented passage gets a 12% tint and a 2px dotted underline in its category colour; a comment placed at the cursor shows as a small speech-bubble icon.

The consumer provides the passage text and the category colour through `--c` (default `rubric` when uncategorised).

- Passage: `hy-anchor`, corner `radius-xs`, underline offset 3px, exactly as the plugin's `styles.css`.
- Point comment: `hy-point`, Lucide `message-square` at 0.9em in the category colour.
- The dotted underline keeps anchors distinct from Obsidian's `==highlight==`. Never use a solid underline (reads as a link) or a solid fill (reads as a highlight).
- After jumping to a passage, flash it with `rubric-soft` for 300ms.

---

L'ancre : passage commenté (teinte 12 % et soulignement pointillé de 2px dans la couleur de la catégorie) ou bulle posée au curseur. Le pointillé distingue l'ancre du surlignage `==…==` d'Obsidian.
