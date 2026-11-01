---
title: Commandes
description: Toutes les commandes d'Hypomnema, avec leur identifiant.
sidebar:
  order: 2
---

Hypomnema ne définit aucun raccourci par défaut. Attribuez ceux que vous voulez dans *Paramètres → Raccourcis*. Un identifiant de commande s'appelle depuis un script avec `app.commands.executeCommandById("<id>")`, ou depuis l'étape *Obsidian command* d'une macro [QuickAdd](/fr/integrations/quickadd/).

## Disponibles dès maintenant

| Commande | Identifiant |
|---|---|
| Commenter la sélection ou le curseur | `hypomnema:comment-selection` |
| Afficher le panneau des commentaires | `hypomnema:open-panel` |
| Afficher ou masquer les commentaires en marge | `hypomnema:toggle-margin` |
| Extraire les commentaires de cette note | `hypomnema:extract-note` |

Le menu des dossiers propose en outre *Extraire les commentaires de ce dossier*, qui n'est pas une commande de la palette.

## À partir de la version 0.5.0

| Commande | Identifiant |
|---|---|
| Lancer une action | `hypomnema:run-action` |
| Une commande par action dont l'option *Commande* est activée, au nom de l'action | `hypomnema:action-<id>` |

*Lancer une action* ouvre la liste de toutes les actions, avec recherche ; elle n'est disponible que s'il existe au moins une action. *Extraire les commentaires de cette note* continue de lancer l'extraction par défaut.
