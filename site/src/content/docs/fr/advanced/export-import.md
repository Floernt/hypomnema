---
title: Export et import
description: Partager ses gestes en JSON.
sidebar:
  order: 5
---

:::note
Disponible à partir de la version 0.5.0. Les boutons se trouvent dans la section *Avancé* des réglages, visible quand les *Fonctions avancées* sont activées.
:::

Les gestes voyagent en JSON. On peut ainsi partager une méthode de lecture, ou la transporter d'un coffre à l'autre.

## Export

*Exporter les gestes* copie tous vos gestes dans le presse-papiers, sous cette forme :

```json
{ "hypomnema": 1, "gestes": [ … ] }
```

Les chemins des [scripts](/fr/advanced/scripts/) sont exportés tels quels, sans le code. Pour ne partager que certains gestes, retirez les autres du tableau `gestes` avant d'envoyer le texte.

## Import

*Importer des gestes* ouvre une fenêtre où l'on colle un export. Hypomnema ajoute les gestes qu'il contient :

- les identifiants déjà présents dans le coffre sont régénérés, de sorte que rien n'est écrasé ;
- les catégories utilisées par les gestes mais absentes du coffre sont signalées, pas créées : ajoutez-les dans la section *Catégories* si vous les voulez ;
- les scripts désignés par leur chemin doivent être ajoutés au coffre séparément.

Lisez un enchaînement importé avant de le lancer, et en particulier les scripts qu'il appelle.
