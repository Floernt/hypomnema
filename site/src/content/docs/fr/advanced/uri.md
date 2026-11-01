---
title: URI
description: Ouvrir un commentaire ou lancer une action depuis un lien.
sidebar:
  order: 3
---

Hypomnema répond aux liens `obsidian://hypomnema`. Ils fonctionnent depuis toute application qui ouvre des liens : un navigateur, un gestionnaire de tâches, un lanceur, une autre note.

## Lien de retour vers un commentaire

Chaque commentaire extrait se termine par un lien ↩ de cette forme :

```text
obsidian://hypomnema?vault=<coffre>&file=<chemin>&id=a1
```

Il ouvre la note `file` du coffre `vault` et sélectionne le passage du commentaire `id`. Les valeurs sont encodées pour l'URL. Ce lien identifie aussi le commentaire dans une note d'extraction : une nouvelle extraction en mode *N'ajouter que les nouveaux commentaires* ignore un commentaire dont le lien y figure déjà.

## Lancer une action

:::note
Disponible à partir de la version 0.5.0.
:::

```text
obsidian://hypomnema?run=<id>&<variable>=<valeur>
```

Ce lien lance l'[action](/fr/concepts/actions/) d'identifiant `<id>`. Tout autre paramètre préremplit l'invite `{{VALUE:…}}` de même nom, que l'action ne pose donc plus :

```text
obsidian://hypomnema?run=k3f9&projet=Th%C3%A8se
```

lance l'action `k3f9` avec `{{VALUE:projet}}` égal à « Thèse ».
