---
title: Tasks
description: Traiter les commentaires extraits comme des tâches avec le plugin Tasks.
sidebar:
  order: 5
---

Le plugin [Tasks](https://publish.obsidian.md/tasks/) n'est pas nécessaire. Dans les formats liste et Kanban, les commentaires extraits s'écrivent sous la forme `- [ ]`, que Tasks reconnaît comme des tâches ordinaires.

## Ce qu'il apporte

Tasks rassemble les éléments ouverts de tout le coffre, avec échéances, priorités et tâches récurrentes. Les commentaires qui appellent une action, une source à vérifier ou une note à rédiger, rejoignent alors la même liste que le reste du travail.

## Recette minimale : les commentaires ouverts des notes d'extraction

Si vos notes d'extraction vont dans un dossier dédié (par exemple `Extractions`, réglé dans *Paramètres → Hypomnema → Extraction → Dossier*), cette requête liste tous les commentaires qui ne sont pas encore cochés :

````markdown
```tasks
not done
path includes Extractions
group by filename
```
````

Cocher une tâche dans la requête la coche dans la note d'extraction. Sur un tableau Kanban, la carte est cochée elle aussi.

## Variante : une échéance dans le gabarit de ligne

:::note
Disponible à partir de la version 0.5.0.
:::

Le gabarit de ligne d'une [Extraction](/fr/concepts/extraction/) peut ajouter des champs Tasks. Les dates relatives sont calculées depuis aujourd'hui : ce gabarit donne à chaque commentaire extrait une échéance une semaine après l'extraction.

```text
{{text}} — « {{quote}} » {{link}} 📅 {{date+7d}}
```

Avec un filtre sur une seule catégorie, comme `a-verifier`, une lecture devient une liste de vérifications datées.
