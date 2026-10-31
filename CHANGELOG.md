# Journal des versions

Toutes les évolutions notables de ce plugin sont consignées ici. Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le [versionnage sémantique](https://semver.org/lang/fr/) (`MAJEUR.MINEUR.CORRECTIF`).

Les commentaires sont stockés en texte brut dans les notes des utilisateurs. Toute évolution de ce format est donc signalée dans une rubrique **Format**, avec son effet sur les notes existantes.

## [Non publié]

### Ajouté

- Section « Contribuer » dans le README, avec les règles de contribution et la liste des traductions disponibles et à faire.

### Modifié

- Le choix de la langue de l'interface passe par une table des langues disponibles : ajouter une traduction revient à ajouter un dictionnaire et une ligne. Une variante régionale (`pt-br`) se replie sur sa langue de base (`pt`), puis sur l'anglais.

## [0.4.0] — 2026-10-31

### Ajouté

- Interface en anglais. Le plugin suit la langue d'Obsidian : français quand Obsidian est en français, anglais sinon. Cela couvre les commandes, le menu contextuel, le panneau, la rédaction, les messages et les réglages. La catégorie d'exemple créée à la première installation suit la même règle (« Idée » / « Idea »).
- Lien vers l'[Obsidian Web Clipper](https://obsidian.md/clipper) dans le README.

### Modifié

- Les couleurs des catégories passent par des classes CSS, générées dans une feuille de style propre au plugin, et non plus par des styles en ligne, conformément aux règles des plugins Obsidian.
- La mise en évidence d'un passage et le rafraîchissement des éditeurs passent par l'API publique de CodeMirror, et non plus par l'accès interne `editor.cm`.
- Captures d'écran anglaises refaites avec l'interface en anglais.

### Corrigé

- Chaque rechargement du plugin (mise à jour, désactivation puis réactivation) ajoutait un onglet « Commentaires » de plus dans la barre latérale. Les doublons sont désormais fermés et un seul onglet est conservé.

## [0.3.1] — 2026-10-31

### Corrigé

- Un passage commenté sur une seule ligne s'affichait comme un lien (texte violet), parce qu'Obsidian lisait les marqueurs `%%[aN%% … %%aN]%%` comme un texte entre crochets. Il garde désormais l'apparence du texte courant.
- Quand on ouvrait une autre note dans le même onglet pendant la rédaction d'un nouveau commentaire, le brouillon n'était pas annulé. L'annulation aurait pu ensuite s'appliquer à la mauvaise note. Le brouillon est désormais retiré de sa propre note, et le panneau suit le changement de note.
- Le fil mis en avant dans le panneau restait sélectionné après un changement de note.

### Modifié

- Les passages commentés reçoivent, en plus du soulignement, une teinte légère de la couleur de leur catégorie. Ils se repèrent mieux à la lecture.

### Ajouté

- Coffre d'exemple `demo-vault/` (un article en anglais, un en français) et visite guidée en captures d'écran dans le README.

## [0.3.0] — 2026-10-31

### Modifié

- Le plugin s'appelle désormais **Hypomnema** (identifiant `hypomnema`, auparavant « Marge — annotations », `marge-annotations`). Le nom précédent était trop proche d'un plugin existant du catalogue (« Margin Annotations »). Le nouveau nom reflète sa vocation : un outil de lecture augmentée, de réflexion et d'organisation de la connaissance, sans lien avec un domaine particulier.
- La catégorie d'exemple devient « Idée » (`idee`) au lieu de « Droit privé ».
- README bilingue (anglais et français) ; description du manifeste en anglais pour le catalogue communautaire.

### Migration depuis « Marge — annotations »

- Les commentaires déjà présents dans les notes ne changent pas : le format est identique.
- Le dossier du plugin change de nom : désinstallez `marge-annotations`, installez `hypomnema`, puis copiez l'ancien `data.json` (catégories et suivi des tags) dans `.obsidian/plugins/hypomnema/`.
- Les raccourcis personnalisés sont à redéfinir, puisque l'identifiant des commandes change avec celui du plugin.

### Supprimé

- Le raccourci par défaut Ctrl+Alt+M, conformément aux règles du catalogue communautaire d'Obsidian. Si vous l'aviez déjà, définissez-le vous-même dans *Paramètres → Raccourcis* (commande « Commenter la sélection ou le curseur »).

## [0.2.0] — 2026-10-31

### Ajouté

- Rédaction directement dans le panneau latéral : un nouveau commentaire, une modification ou une réponse s'écrit dans l'onglet « Commentaires », sans fenêtre qui masque le texte. Ctrl/Cmd+Entrée enregistre, Échap annule.
- Commentaire au curseur : sans sélection, la commande pose un commentaire à l'endroit du curseur, affiché sous forme d'une petite bulle dans le texte. Le panneau montre quelques mots de contexte autour.
- Catégories de commentaires : chacune a un nom, une couleur et un tag, et se règle dans *Paramètres → Hypomnema*. Une catégorie d'exemple est fournie (« Droit privé », vert, `droit-prive`).
- Couleur de la catégorie appliquée au soulignement, à la bulle et à la carte du panneau.
- Tag de la catégorie ajouté automatiquement aux propriétés (`tags`) de la note. Il est retiré quand plus aucun commentaire de cette catégorie n'y figure, sauf s'il était présent avant que le plugin ne l'ajoute.
- Le clic droit propose « Commenter ici » quand rien n'est sélectionné.

### Modifié

- La commande devient « Commenter la sélection ou le curseur ». Son identifiant ne change pas, donc les raccourcis personnalisés sont conservés.
- Les marqueurs d'un nouveau commentaire sont posés dès l'ouverture de la rédaction. Ils sont retirés si celle-ci est annulée, et suivent le texte s'il change pendant la saisie.
- `minAppVersion` passe à 1.4.4 (utilisation de `processFrontMatter`).

### Supprimé

- Les fenêtres modales de saisie et de modification. Seule la confirmation de suppression d'un fil reste une fenêtre.

### Format

- Ancre vide autorisée pour un commentaire au curseur : `%%[a4%%%%a4]%%`.
- Catégorie facultative, notée par son tag juste après la date : `[a1] 2026-10-31 #droit-prive Texte`.
- Un commentaire sans catégorie dont le texte commence par `#` est écrit `\#…`, pour ne pas être confondu avec une catégorie.
- Ces changements sont rétrocompatibles : les notes écrites avec la version 0.1.x se lisent sans modification.

### Connu

- Le raccourci Ctrl+Alt+M est défini par défaut. Les règles du catalogue communautaire d'Obsidian l'interdisent : il sera retiré avant la soumission.

## [0.1.2] — 2026-10-31

### Supprimé

- Les cartes de commentaires affichées en marge du texte. Le panneau latéral devient la seule vue des commentaires.

### Modifié

- Un clic sur un passage commenté ouvre l'onglet « Commentaires » et met en évidence le fil correspondant.

## [0.1.1] — 2026-10-31

### Ajouté

- Onglet « Commentaires » créé automatiquement dans la barre latérale de droite, à côté des rétroliens, des liens sortants et du plan.
- Raccourci par défaut Ctrl+Alt+M (Cmd+Option+M sur macOS), le même que dans Word.

### Modifié

- L'entrée « Commenter la sélection » du clic droit est placée parmi les commandes de mise en forme.

## [0.1.0] — 2026-10-31

### Ajouté

- Commentaires attachés à un passage, stockés dans la note elle-même.
- Fils de réponse à un niveau, avec la date de chaque entrée.
- Panneau latéral listant les commentaires dans l'ordre du texte ; un clic ramène au passage.
- Affichage en Aperçu en direct : marqueurs masqués, passage souligné, bloc d'annotations replié.
- Signalement des commentaires orphelins, dont les marqueurs ont été supprimés à la main.
- Recherche des commentaires dans tout le coffre par la recherche native d'Obsidian.

### Format

- Passage commenté : `%%[aN%%texte%%aN]%%`.
- Bloc en fin de note : `%% annotations` … `%%`, une entrée par ligne (`[aN] AAAA-MM-JJ texte`), les réponses étant notées `[aN.k]` et indentées.

[Non publié]: https://github.com/Floernt/hypomnema/compare/0.4.0...HEAD
[0.4.0]: https://github.com/Floernt/hypomnema/compare/0.3.1...0.4.0
[0.3.1]: https://github.com/Floernt/hypomnema/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/Floernt/hypomnema/releases/tag/0.3.0
