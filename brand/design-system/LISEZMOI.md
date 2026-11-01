# Hypomnema, design system (export du 2026-11-01)

La charte complète est dans `README.md` (anglais puis français).

- `hypomnema.css` : tout en un (variables des tokens, polices, classes `hy-` des composants). Placez-le à côté du dossier `fonts/`.
- `tokens.json` : la source des valeurs (couleurs par thème, typographie, espacements, rayons, ombre).
- `tokens.css` : les variables CSS seules. Thème Nuit : `data-theme="dark"` sur un élément parent.
- `components/` : `bundle.css`, et pour chaque composant ses règles d'usage (`README.md`) et un aperçu ouvrable dans un navigateur (`preview.html`).
- `fonts/` : Newsreader, IBM Plex Sans, IBM Plex Mono (SIL Open Font License), sous-ensemble latin.
- Le logo et toutes ses déclinaisons sont dans `../logo/` (`svg/`, `png/`). `assets/icons` : icônes Lucide utilisées par le plugin (licence ISC).
