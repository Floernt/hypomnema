---
title: Export et import
description: Partager ses actions en JSON.
sidebar:
  order: 5
---

:::note
Disponible à partir de la version 0.5.0. Les boutons se trouvent dans la section *Avancé* des réglages, visible quand les *Fonctions avancées* sont activées.
:::

Les actions voyagent en JSON. On peut ainsi partager une méthode de lecture, ou la transporter d'un coffre à l'autre.

## Export

*Exporter les actions* copie toutes vos actions dans le presse-papiers, sous cette forme :

```json
{ "hypomnema": 1, "actions": [ … ] }
```

Pour ne partager que certaines actions, retirez les autres du tableau `actions` avant d'envoyer le texte.

## Import

*Importer des actions* ouvre une fenêtre où l'on colle un export. Hypomnema ajoute les actions qu'il contient :

- les identifiants déjà présents dans le coffre sont régénérés, de sorte que rien n'est écrasé ;
- les catégories utilisées par les actions mais absentes du coffre sont signalées, pas créées : ajoutez-les dans la section *Catégories* si vous les voulez ;

Lisez un enchaînement importé avant de le lancer : il peut appeler n'importe quelle commande Obsidian.
