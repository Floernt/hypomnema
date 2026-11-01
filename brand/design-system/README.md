*English first, français ensuite.*

## English

Hypomnema is an Obsidian plugin for commenting on what you read: passages and points of a note get comments in a side panel, sorted into coloured categories linked to tags. The name is the Greek ὑπόμνημα, a note kept as a reminder, a commentary. The identity borrows from the annotated page: warm paper, brown-black ink, and one red accent taken from rubrication, the red ink scribes used for marks in the margin.

Inside Obsidian the plugin inherits the user's theme and their own category colours. This system applies to everything around it: the site (the repository's CNAME points to hypomnema.tools), the README, release notes, screenshots framing, social images and slides.

### Voice

Write the way the repository README does: plain sentences, concrete actions, second person.

- Address the reader as "you". Describe what happens, in order: "Select a sentence and run the command. The draft opens in the panel, beside the passage."
- Sentence case everywhere, including headings and buttons. The product name is "Hypomnema" in prose; the logo sets it in lowercase.
- Name interface elements as Obsidian names them, in italics: *Comments* panel, *Settings → Hotkeys*, *Live Preview*. Use Obsidian's vocabulary: vault, note, properties, tags.
- Prefer one precise example to a claim. The README's "*Diophantus* appears only in a comment, never in the article" is the model.
- No emoji, no exclamation marks, no superlatives ("powerful", "seamless"). State limitations openly, as the README's *Limitations* section does.
- Dates in ISO form (`2026-10-28`), matching the storage format.

### Logo

The mark is an opening bracket in `ink` with a disc in `rubric`: the anchor `%%[a1%%` that opens a commented passage, and the point where a comment sits. The lockup adds the lowercase wordmark, outlined from Newsreader Medium at its display optical size.

- Use `hypomnema-lockup.svg` on `paper` and light grounds, `hypomnema-lockup-dark.svg` on `ink` and dark grounds. Same rule for the mark and the wordmark.
- Use the mark alone below 120px of available width, as a favicon, or next to a heading that already spells the name. `../logo/svg/icon/hypomnema-icon-paper.svg` is the mark on a paper tile with `radius-lg` corners.
- Clear space around the logo: one disc diameter on every side. Minimum size: mark 16px, lockup 96px wide.
- The disc is always `rubric` and the bracket always `ink`. Do not recolour the disc with a category colour, do not reset the wordmark in another face, do not add a shadow or outline.
- The mark is a proposal drawn for this system. It is not registered and has not been checked against existing marks.

### Colour

- Grounds: `paper` for pages, `paper-raised` for cards, the composer and code, `paper-sunk` for the panel and sidebars.
- Text: `ink` for body and headings, `ink-muted` for dates, captions and quoted passages. Both pass 5:1 or more on every ground in both themes.
- Accent: `rubric`, used sparingly. One primary button per view, links, the focus ring, the dot of the mark. `rubric-soft` for the flash after a jump and tinted callouts; text on it stays `ink`. On a rubric fill, text is `on-rubric`.
- Borders: `line` for decorative hairlines, `line-strong` for anything a reader must see (inputs, chips, secondary buttons; 3:1 or more).
- Categories: `cat-idee` (the plugin's actual default, `#2e9e5b`), `cat-question`, `cat-verifier`, `cat-citation`. One hex each for both themes, because the plugin stores a single colour per category. Use them only as marks: underline, 12% tint, chip dot, card edge. Category labels stay in `ink`, so a category is always identified by its name. `cat-idee` reaches only 2.7:1 on `paper-sunk`: there, never let it carry meaning alone.
- Two themes: *Papier / Paper* (default) and *Nuit / Night*. In the night theme rubric lightens, so `on-rubric` turns dark.

### Type

- `serif` (Newsreader, variable, with optical sizes) for reading and display: `display`, `title`, `heading`, `subheading`, `reading`, `body`, `quote`. Long text in `reading`, never wider than `measure-reading`.
- `sans` (IBM Plex Sans) for interface: `ui`, `ui-strong`, `ui-small`. Comment text in the panel is `ui`, the quoted passage above it is `quote`.
- `mono` (IBM Plex Mono) for the storage format, regexes, paths and commands: `code`.
- All three faces are under the SIL Open Font License; the files cover Latin and French accents.

### Space, shape, depth

- A 4px grid: `space-1` to `space-16`. Page gutter `space-4` on phones, `space-8` on desktop; `space-12` between sections.
- Corners stay small: `radius-xs` for the passage tint, `radius-sm` for buttons, chips, cards and code; `radius-md` for screenshots; `radius-full` for category dots only.
- Hairlines first. `shadow-raised` is the only shadow, for the active thread and floating menus.
- Focus: 2px solid `focus` outline, 2px offset, on every interactive element.
- Motion: one effect, the 300ms `rubric-soft` flash on a passage after a jump. Nothing else moves.

### Iconography

The plugin draws its icons with Obsidian's `setIcon`, which uses Lucide: `message-square` (panel tab, point comment), `message-square-plus` (comment command), `pencil` (edit), `trash-2` (delete). Copies are in the *Icons* group, recoloured to `ink` because an `<img>` cannot inherit `currentColor`. In HTML, inline the SVG and keep `stroke="currentColor"`, 2px stroke, 14px in the panel. Use other Lucide icons only when Obsidian would; no emoji.

### Components

`Anchor`, `CommentThread`, `Composer` and `CategoryChip` reproduce the plugin's own interface (classes in `components/bundle.css`, prefix `hy-`) for the site, docs and mock-ups. `Button` and `StorageFormat` serve the site and documentation. They are plain HTML and CSS, no JavaScript.

---

## Français

Hypomnema est un plugin Obsidian pour commenter ce qu'on lit : des passages ou des points d'une note reçoivent des commentaires dans un panneau latéral, classés par catégories de couleur reliées à des tags. Le nom vient du grec ὑπόμνημα, la note qu'on garde pour se souvenir, le commentaire. L'identité reprend la page annotée : papier chaud, encre brun-noir, et un seul accent rouge emprunté à la rubrique, l'encre rouge des copistes pour les marques en marge.

Dans Obsidian, le plugin suit le thème de l'utilisateur et ses propres couleurs de catégorie. Ce système s'applique à tout ce qui l'entoure : le site (le CNAME du dépôt pointe vers hypomnema.tools), le README, les notes de version, la mise en page des captures, les visuels et les présentations.

### Ton

Écrire comme le README du dépôt : des phrases simples, des gestes concrets.

- Le README français alterne « on » pour décrire un geste (« On sélectionne une phrase et on lance la commande ») et « vous » pour s'adresser au lecteur (« attribuez un raccourci »). Garder cet usage.
- Majuscule initiale seulement, titres et boutons compris. « Hypomnema » dans le texte ; le logo l'écrit en minuscules.
- Nommer l'interface comme Obsidian la nomme, entre guillemets français ou en italique : panneau « Commentaires », *Paramètres → Raccourcis*, *Aperçu en direct*. Vocabulaire d'Obsidian : coffre, note, propriétés, tags.
- Un exemple précis plutôt qu'une affirmation : « Diophante ne figure que dans un commentaire, jamais dans l'article. »
- Pas d'emoji, pas de point d'exclamation, pas de superlatifs. Dire les limites franchement.
- Typographie française : espace avant `:` `;` `?`, guillemets « ». Dates au format ISO (`2026-10-28`).

### Logo

Le symbole est un crochet ouvrant en `ink` et un disque en `rubric` : l'ancre `%%[a1%%` qui ouvre un passage commenté, et le point où se pose un commentaire. Le logo complet y ajoute le nom en minuscules, vectorisé à partir de Newsreader Medium en taille optique d'affichage.

- `hypomnema-lockup.svg` sur `paper` et les fonds clairs, `hypomnema-lockup-dark.svg` sur `ink` et les fonds sombres. Même règle pour le symbole et le logotype.
- Le symbole seul sous 120px de largeur disponible, en favicon, ou à côté d'un titre qui écrit déjà le nom. `../logo/svg/icon/hypomnema-icon-paper.svg` : le symbole sur une tuile papier aux coins `radius-lg`.
- Zone de protection : un diamètre de disque de chaque côté. Taille minimale : symbole 16px, logo complet 96px de large.
- Le disque reste `rubric`, le crochet reste `ink`. Ne pas recolorer le disque avec une couleur de catégorie, ne pas recomposer le nom dans une autre police, pas d'ombre ni de contour.
- Ce symbole est une proposition dessinée pour ce système. Il n'est pas déposé et n'a pas fait l'objet d'une recherche d'antériorité.

### Couleur

- Fonds : `paper` pour les pages, `paper-raised` pour les cartes, la rédaction et le code, `paper-sunk` pour le panneau et les barres latérales.
- Texte : `ink` pour le texte et les titres, `ink-muted` pour les dates, légendes et passages cités. Contraste de 5:1 au moins sur chaque fond, dans les deux thèmes.
- Accent : `rubric`, avec parcimonie. Un seul bouton principal par écran, les liens, l'anneau de focus, le disque du logo. `rubric-soft` pour le flash après un saut et les encadrés ; le texte posé dessus reste en `ink`. Sur un fond rubric, le texte est en `on-rubric`.
- Bordures : `line` pour les filets décoratifs, `line-strong` pour tout ce qui doit se voir (champs, pastilles, boutons secondaires ; 3:1 au moins).
- Catégories : `cat-idee` (la vraie couleur par défaut du plugin, `#2e9e5b`), `cat-question`, `cat-verifier`, `cat-citation`. Une seule valeur par catégorie pour les deux thèmes, car le plugin enregistre une couleur par catégorie. Uniquement comme marque : soulignement, teinte à 12 %, point de pastille, bord de carte. Le libellé reste en `ink`. `cat-idee` n'atteint que 2,7:1 sur `paper-sunk` : à cet endroit, elle ne doit jamais porter seule l'information.
- Deux thèmes : *Papier* (par défaut) et *Nuit*. En thème Nuit, rubric s'éclaircit, donc `on-rubric` devient sombre.

### Typographie

- `serif` (Newsreader, variable, avec tailles optiques) pour la lecture et l'affichage : `display`, `title`, `heading`, `subheading`, `reading`, `body`, `quote`. Texte long en `reading`, jamais plus large que `measure-reading`.
- `sans` (IBM Plex Sans) pour l'interface : `ui`, `ui-strong`, `ui-small`. Le commentaire dans le panneau est en `ui`, le passage cité au-dessus en `quote`.
- `mono` (IBM Plex Mono) pour le format de stockage, les regex, les chemins et les commandes : `code`.
- Les trois polices sont sous licence SIL Open Font License ; les fichiers couvrent le latin et les accents français.

### Espace, forme, profondeur

- Grille de 4px : `space-1` à `space-16`. Gouttière `space-4` sur mobile, `space-8` sur ordinateur ; `space-12` entre sections.
- Petits arrondis : `radius-xs` pour la teinte des passages, `radius-sm` pour boutons, pastilles, cartes et code ; `radius-md` pour les captures ; `radius-full` pour les points de catégorie seulement.
- Des filets avant tout. `shadow-raised` est la seule ombre, pour le fil actif et les menus.
- Focus : contour plein de 2px en `focus`, décalé de 2px, sur tout élément interactif.
- Mouvement : un seul effet, le flash `rubric-soft` de 300ms sur un passage après un saut.

### Icônes

Le plugin dessine ses icônes avec `setIcon` d'Obsidian, qui s'appuie sur Lucide : `message-square` (onglet du panneau, commentaire au curseur), `message-square-plus` (commande de commentaire), `pencil` (modifier), `trash-2` (supprimer). Les copies du groupe *Icons* sont recolorées en `ink`, car une `<img>` ne peut pas hériter de `currentColor`. En HTML, intégrer le SVG en ligne avec `stroke="currentColor"`, trait de 2px, 14px dans le panneau. Pas d'emoji.

### Composants

`Anchor`, `CommentThread`, `Composer` et `CategoryChip` reproduisent l'interface du plugin (classes `hy-` dans `components/bundle.css`) pour le site, la documentation et les maquettes. `Button` et `StorageFormat` servent le site et la documentation. HTML et CSS uniquement, sans JavaScript.
