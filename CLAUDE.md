# Hypomnema — plugin Obsidian

Lecture augmentée : commentaires sur des passages, fils de réponse, catégories liées à des tags. Le code est dans `src/`, les tests dans `tests/` (vitest), la doc dans `site/` (Astro Starlight) et la charte dans `brand/`. Les specs sont dans `docs/superpowers/specs/`.

## Vérifier chaque proposition dans la doc officielle

Toute proposition (API, événement, réglage, CSS, comportement) est vérifiée dans la documentation officielle d'Obsidian, https://docs.obsidian.md/Home, **avant** d'entrer dans une spec. Pages de référence :

- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) et [Developer policies](https://docs.obsidian.md/Developer+policies)
- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin) : la revue est automatique, seules les erreurs bloquent l'installation, et chaque correction demande une nouvelle release au numéro incrémenté
- [Référence de l'API TypeScript](https://docs.obsidian.md/Reference/TypeScript+API) : la version d'apparition de chaque API est comparée au `minAppVersion` du manifest (aujourd'hui 1.7.2)
- [CSS variables](https://docs.obsidian.md/Reference/CSS+variables/CSS+variables)

Chaque spec comporte une section **« Vérification dans la doc officielle »**. Pour chaque point, elle indique la page consultée, son lien et la conclusion. Ce que la doc ne couvre pas y est signalé comme tel, sans être présenté comme vérifié.

## Pièges déjà rencontrés au scan du catalogue

- Le scan lit tous les `.ts` du dépôt, `site/` et `brand/` compris. Ses `node_modules` ne sont pas installés : un fichier TypeScript qui importe Astro produit des avertissements `no-unsafe-*`. Les fichiers de configuration du site sont donc en `.mjs`.
- Le lint CSS lit aussi tous les `.css`, `brand/` compris. `text-decoration-*` et le raccourci `text-decoration: underline dotted …` sont jugés partiellement pris en charge, et les préfixes `-webkit-` n'y changent rien. Pour un soulignement, utiliser `border-bottom`.
- Toute directive `eslint-disable` porte sa raison après ` -- `.
- On ne peut pas désactiver `obsidianmd/rule-custom-message`, qui regroupe `no-new-func`, `no-console`, etc. Le `new Function` des scripts utilisateur (`src/runner.ts`) reste donc signalé en avertissement : c'est assumé et non bloquant. Un import par Blob est pire, puisque `no-unsanitized/method` le classe en erreur.
- Pas de `!important`. Une API récente (par exemple `update()` des réglages, 1.13) se place derrière `requireApiVersion`.

## Avant chaque release

1. `npm ci --prefix scripts/lint` (une fois), puis `npm run lint` : zéro erreur. Le lint vit dans un paquet séparé parce que typescript-eslint exige TypeScript < 6.1, alors que le plugin compile avec TypeScript 7.
2. `npm test`, puis `npm run build`.
3. Versions : `manifest.json`, `package.json`/`package-lock.json`, `versions.json` et `CHANGELOG.md`. Le tag `x.y.z`, sans « v », déclenche `.github/workflows/release.yml`.
