---
title: Format de stockage
description: Comment les commentaires s'écrivent dans la note, pour les scripts et pour qui lit sans le plugin.
sidebar:
  order: 1
---

Les commentaires sont du texte brut dans la note. Ils restent lisibles sans le plugin, et n'importe quel script peut les lire. Le format est un engagement : les notes écrites avec une version antérieure continuent de fonctionner, et toute évolution est rétrocompatible et consignée dans le [CHANGELOG](https://github.com/Floernt/hypomnema/blob/main/CHANGELOG.md).

## Les marqueurs dans le texte

Un passage commenté est délimité par deux commentaires Obsidian qui partagent un identifiant. Un commentaire posé au curseur est une ancre vide :

```text
L'auteur soutient que %%[a1%%la mémoire est une reconstruction%%a1]%% plutôt qu'un enregistrement.
Un commentaire posé ici %%[a2%%%%a2]%% sans sélection.
```

## Le bloc des annotations

Le texte des commentaires se trouve dans un bloc unique, en fin de note :

```text
%% annotations
[a1] 2026-10-31 #idee Premier commentaire
    suite (lignes de continuation indentées)
  [a1.1] 2026-11-04 Réponse au commentaire a1
[a2] 2026-10-31 Commentaire sans catégorie
%%
```

Un commentaire racine a l'identifiant `aN` ; ses réponses sont `aN.k`, indentées de deux espaces. Chaque entrée commence par `[id] AAAA-MM-JJ`. Peut suivre un `#tag` facultatif (la catégorie, pour les seules racines), puis le texte. Les lignes indentées qui suivent prolongent l'entrée. Un texte sans catégorie qui commence par `#` s'écrit `\#…`.

`%%` est masqué en mode lecture : la note reste propre sans le plugin.

## Pour les scripts

L'expression régulière d'un passage commenté est `%%\[(a\d+)%%([\s\S]*?)%%\1\]%%`. Pour un commentaire au curseur, le groupe 2 est vide.

Un commentaire dont les marqueurs ont été supprimés reste dans le bloc. Le panneau le signale comme orphelin.

Pour écrire des commentaires depuis un script, préférez l'[API](/fr/advanced/api/) à la modification manuelle du texte : elle tient à jour les tags et déclenche les événements.

## Tags automatiques

Quand un commentaire reçoit une catégorie, le tag correspondant est ajouté à la propriété `tags` de la note. Il est retiré quand plus aucun commentaire de cette catégorie n'y figure, sauf si la note portait déjà ce tag avant. Pour faire la différence, le plugin garde dans `data.json` la liste des tags qu'il a lui-même ajoutés.
