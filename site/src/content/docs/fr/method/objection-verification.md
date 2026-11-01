---
title: L'objection et la vérification
description: Deux gestes d'annotation pour lire contre le texte.
sidebar:
  order: 2
---

:::note
Disponible à partir de la version 0.5.0.
:::

:::caution[Brouillon — section à réécrire par l'auteur]
« L'idée » et « Un exemple vécu » sont un brouillon.
:::

## L'idée

Deux réactions reviennent dans presque toute lecture critique : « je ne suis pas d'accord » et « il faut que je vérifie ». Chacune mérite son geste, parce que chacune appelle une suite différente. Une objection est un argument à développer ; une vérification est une tâche à clore. Leur donner un raccourci rend la réaction assez peu coûteuse pour qu'on l'écrive sur le moment, au lieu de la remettre à plus tard.

## Un exemple vécu

Dans *Pourquoi on oublie ce qu'on lit*, l'article affirme que l'essentiel de ce qu'on lit s'oublie dans l'heure. « À vérifier » demande « Vérifier quoi ? », la réponse est « la source des chiffres de la courbe de l'oubli », et le commentaire devient « Vérifier la source des chiffres de la courbe de l'oubli ». Quelques paragraphes plus loin, l'idée qu'il suffirait d'annoter pour retenir reçoit une « Objection » : « Objection : annoter n'est pas relire. »

## Le réglage

Créez deux gestes [Annotation](/fr/concepts/annotation/) dans *Paramètres → Hypomnema → Gestes*, et activez *Commande* pour chacun.

| Nom | Catégorie | Texte de départ |
|---|---|---|
| Objection | `#objection` | `Objection : {{cursor}}` |
| À vérifier | `#a-verifier` | `Vérifier {{VALUE:quoi ?}}` |

Les catégories `objection` et `a-verifier` doivent exister dans la section *Catégories*. Attribuez ensuite un raccourci à chaque commande dans *Paramètres → Raccourcis*, par exemple Ctrl+Alt+O et Ctrl+Alt+V.

## Variantes

**Une liste de vérifications.** Une [Extraction](/fr/concepts/extraction/) de portée *Tout le coffre*, filtrée sur la catégorie `a-verifier`, au format Kanban, donne un tableau unique de tout ce qui reste à vérifier.

**Demander la catégorie.** Un seul geste, de catégorie « Demander à chaque fois » (`"ask"`) et sans *Texte de départ*, remplace plusieurs gestes quand on préfère choisir à chaque commentaire.

**Répondre à l'objection.** Quand la réponse vient, écrivez-la dans le fil de l'objection plutôt que de modifier le commentaire : le fil garde la trace des deux moments de la lecture.
