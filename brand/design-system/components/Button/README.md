# Button

Buttons for the site and docs: one primary (rubric fill) per view, secondary (outline), quiet (text only, for panel actions).

The consumer provides the label and, for quiet buttons, an optional 14px Lucide icon drawn with `currentColor`.

- `hy-btn hy-btn--primary`: the one action that matters on the screen (download, install). Text in `on-rubric`.
- `hy-btn`: secondary actions, `line-strong` border on `paper-raised`.
- `hy-btn hy-btn--quiet`: Reply, Edit, Delete in a thread. Hover tint `rubric-soft`.
- Labels are verbs in sentence case: "Download", "Répondre". No emoji, no trailing arrow.
- Never two primary buttons side by side.

---

Boutons du site et de la doc : un seul bouton principal (fond rubric) par écran, secondaire (contour), discret (texte seul, pour les actions du panneau). Libellés : un verbe, majuscule initiale seulement.
