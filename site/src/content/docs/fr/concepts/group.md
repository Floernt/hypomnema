---
title: Groupe
description: Un geste qui ouvre un menu d'autres gestes.
sidebar:
  order: 8
---

:::note
Disponible à partir de la version 0.5.0. Les groupes relèvent du niveau 3 : activez les *Fonctions avancées* dans les réglages pour en créer un.
:::

Un groupe réunit plusieurs gestes derrière une seule commande. Le lancer ouvre un menu avec recherche qui liste ses enfants ; en choisir un l'exécute. C'est le *Multi* de QuickAdd.

```ts
interface GroupGeste extends GesteBase { kind: "group"; children: string[]; }
```

`children` contient des identifiants de gestes, dans l'ordre où le menu les affiche. Un enfant peut être un geste de n'importe quel type, y compris un enchaînement ou un autre groupe. Si un groupe finit par s'appeler lui-même, directement ou par l'intermédiaire d'un autre groupe ou d'un enchaînement, l'exécution s'arrête avec une notification.

## Exemple

Un groupe « Lire », doté d'un raccourci, peut réunir les gestes d'annotation les plus fréquents : « Objection », « À vérifier », « Citation ». Un raccourci, puis deux ou trois lettres pour choisir le geste. Les gestes gardent leur propre commande si l'on veut un raccourci direct pour certains d'entre eux.
