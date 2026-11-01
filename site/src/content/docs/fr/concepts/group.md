---
title: Groupe
description: Une action qui ouvre un menu d'autres actions.
sidebar:
  order: 8
---

:::note
Disponible à partir de la version 0.5.0. Les groupes relèvent du niveau 3 : activez les *Fonctions avancées* dans les réglages pour en créer un.
:::

Un groupe réunit plusieurs actions derrière une seule commande. Le lancer ouvre un menu avec recherche qui liste ses enfants ; en choisir un l'exécute.

```ts
interface GroupAction extends ActionBase { kind: "group"; children: string[]; }
```

`children` contient des identifiants d'actions, dans l'ordre où le menu les affiche. Un enfant peut être une action de n'importe quel type, y compris un enchaînement ou un autre groupe. Si un groupe finit par s'appeler lui-même, directement ou par l'intermédiaire d'un autre groupe ou d'un enchaînement, l'exécution s'arrête avec une notification.

## Exemple

Un groupe « Lire », doté d'un raccourci, peut réunir les actions d'annotation les plus fréquentes : « Objection », « À vérifier », « Citation ». Un raccourci, puis deux ou trois lettres pour choisir l'action. Les actions gardent leur propre commande si l'on veut un raccourci direct pour certains d'entre eux.
