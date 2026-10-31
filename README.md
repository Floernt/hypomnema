# Hypomnema (plugin Obsidian)

Hypomnema est un outil de lecture augmentée, de réflexion et d'organisation de la connaissance. Il permet de commenter un passage ou un point précis d'une note, de rédiger et répondre dans un panneau latéral (comme le volet des commentaires de Word), et de classer ces commentaires par catégories reliées à des tags. Il convient particulièrement aux articles capturés avec le Web Clipper : le texte source et vos remarques ne se mélangent jamais. Les commentaires restent du texte brut dans la note : ils sont cherchables, synchronisables et lisibles sans le plugin.

## Utilisation

- **Commenter** : sélectionnez un passage, ou placez simplement le curseur, puis faites un clic droit (« Commenter la sélection » ou « Commenter ici ») ou passez par la palette de commandes. Pour aller plus vite, attribuez un raccourci à la commande *Commenter la sélection ou le curseur* dans *Paramètres → Raccourcis* : Ctrl+Alt+M, celui de Word, est un bon choix. La rédaction s'ouvre dans le panneau de droite, sans masquer le texte. Ctrl+Entrée enregistre, Échap annule.
- **Catégories** : au moment de rédiger, vous pouvez choisir une catégorie (une pastille de couleur). Elle colore le passage et ajoute son tag aux propriétés de la note. Les catégories se règlent dans *Paramètres → Hypomnema* (nom, couleur, tag).
- **Dans la note** : un passage commenté est souligné, et un commentaire posé au curseur s'affiche comme une petite bulle. Un clic sur l'un ou l'autre ouvre le fil dans le panneau.
- **Panneau** : un onglet « Commentaires » est ajouté dans la barre de droite, à côté des rétroliens, des liens sortants et du plan. Il liste les commentaires de la note dans l'ordre du texte. Un clic ramène au passage.
- **Répondre / modifier / supprimer** : ces actions se trouvent sur chaque fil. Supprimer un commentaire retire ses marqueurs et laisse le texte source intact. Ctrl+Z annule.
- **Recherche** : les commentaires étant du texte dans la note, la recherche d'Obsidian les trouve dans tout le coffre. Les tags de catégorie, eux, figurent dans les propriétés et fonctionnent avec `tag:#…`, le volet des tags et Dataview.

### Tags automatiques

Quand un commentaire reçoit une catégorie, le tag correspondant est ajouté à la propriété `tags` de la note. Il est retiré quand plus aucun commentaire de cette catégorie n'y figure. Si la note portait déjà ce tag avant, le plugin n'y touche jamais. Pour le savoir, il garde dans `data.json` la liste des tags qu'il a lui-même ajoutés.

## Format (pour les scripts)

Le passage commenté est délimité par deux commentaires Obsidian portant le même identifiant. Un commentaire posé au curseur est une ancre vide :

```text
L'auteur soutient que %%[a1%%la mémoire est une reconstruction%%a1]%% plutôt qu'un enregistrement.
Un commentaire posé ici %%[a2%%%%a2]%% sans sélection.
```

Le texte des commentaires est placé dans un bloc unique en fin de note :

```text
%% annotations
[a1] 2026-10-31 #idee Premier commentaire
    suite du commentaire (lignes de continuation indentées)
  [a1.1] 2026-11-04 Réponse au commentaire a1
[a2] 2026-10-31 Commentaire sans catégorie
%%
```

- La racine a pour identifiant `aN`, et ses réponses `aN.k`, indentées de deux espaces.
- Chaque entrée commence par `[id] AAAA-MM-JJ`, suivi éventuellement de `#tag` (la catégorie, racines uniquement), puis du texte. Les lignes suivantes, indentées, prolongent l'entrée.
- Un texte sans catégorie qui commence par `#` est écrit `\#…`.
- `%%` est masqué en mode lecture : sans le plugin, la note reste propre.
- Expression régulière pour un passage commenté : `%%\[(a\d+)%%([\s\S]*?)%%\1\]%%`. Pour un commentaire au curseur, le groupe 2 est vide.
- Un commentaire dont les marqueurs ont été supprimés reste dans le bloc. Le panneau le signale comme orphelin.

## Versions

L'historique des versions et des changements de format est consigné dans [CHANGELOG.md](CHANGELOG.md).

Pour publier une version :

1. Déplacez les entrées de `[Non publié]` sous un nouveau numéro, daté.
2. Mettez ce numéro dans `manifest.json` et `package.json`, et ajoutez-le à `versions.json` avec sa `minAppVersion`.
3. Lancez `npm test` puis `npm run build`.
4. Créez une *release* GitHub dont le tag est exactement ce numéro (sans `v`), avec `main.js`, `manifest.json` et `styles.css` en pièces jointes.

## Développement

```bash
npm install
npm test          # tests du format (vitest)
npm run build     # compile et copie dans test-vault/.obsidian/plugins/
npm run dev       # compilation continue
```

Le dossier `test-vault/` est un coffre d'essai : ouvrez-le dans Obsidian pour tester le plugin.

Pour installer le plugin dans un coffre réel, copiez `main.js`, `manifest.json` et `styles.css` dans `<coffre>/.obsidian/plugins/hypomnema/`, puis activez-le dans *Modules complémentaires*.

## Limites

Le plugin fonctionne uniquement en Aperçu en direct : en mode lecture, les marqueurs sont masqués, mais le passage n'est pas souligné. Les fils ne comptent qu'un niveau de réponse, et chaque commentaire n'a qu'une catégorie.

## Licence

MIT. Voir [LICENSE](LICENSE).
