---
title: Extraction
description: Recopier ses commentaires dans une note à part, en liste, en tableau ou en tableau Kanban.
sidebar:
  order: 4
---

:::note
L'extraction par défaut est disponible dès maintenant. Ses *Plus d'options*, ainsi que les extractions nommées avec leur portée, leur filtre et leur gabarit, sont disponibles à partir de la version 0.5.0.
:::


![Formulaire d'une extraction nommée : portée, format, dossier, nom de la note, gabarit de ligne, puis Plus d'options.](/screenshots/13-action-extraction-fr.png)

Une extraction recopie des commentaires dans une note à part. Chaque commentaire se termine par un lien ↩ qui rouvre la note source et sélectionne le passage. Une note d'extraction est une copie : la modifier ne change pas les commentaires de la note source.

## L'extraction par défaut

La commande *Extraire les commentaires de cette note* (`hypomnema:extract-note`), ou un clic droit sur un dossier → *Extraire les commentaires de ce dossier*, lance l'extraction par défaut. Elle relève du niveau 1 et se règle dans la section *Extraction* de *Paramètres → Hypomnema* :

| Réglage | Effet |
|---|---|
| Format | *Liste par catégorie*, *Tableau*, ou *Tableau Kanban* (une colonne par catégorie, plus une colonne *Fait*). |
| Dossier | Où créer les notes d'extraction. Vide : à côté de la note source (racine du coffre pour un dossier). |
| Nom de la note | `{{note}}` est remplacé par le nom de la note ou du dossier, `{{date}}` par la date du jour. Par défaut : `{{note}} — commentaires`. |
| Gabarit de ligne | Utilisé par les formats liste et Kanban. Par défaut : `{{text}} — « {{quote}} » {{link}}`. |
| Inclure les réponses | Ajoute les réponses sous chaque commentaire. |
| Si la note existe déjà | *N'ajouter que les nouveaux commentaires* (par défaut) garde vos modifications ; *La remplacer* réécrit la note. |

En mode *N'ajouter que les nouveaux commentaires*, le lien ↩ identifie chaque commentaire : celui dont le lien figure déjà dans la note est ignoré, où que vous l'ayez déplacé. Les cartes déplacées ou cochées restent où elles sont.

La note porte les propriétés `hypomnema-extract`, `hypomnema-source` et `hypomnema-date`, ainsi que les tags des catégories : [Dataview](/fr/integrations/dataview/) la retrouve.

À partir de la version 0.5.0, l'extraction par défaut reste simplement « Extraction », dans la section de niveau 1. Elle ne peut pas être supprimée, ce qui garantit que `extract-note` fonctionne toujours, et n'apparaît pas dans la liste des actions. Ses options supplémentaires, le filtre par catégorie, *Actifs depuis*, *Note-gabarit* et *Passer par Templater*, se trouvent derrière le bouton *Plus d'options* de la section *Extraction*. Depuis une commande, elle porte sur la note active ; depuis le menu d'un dossier, sur le dossier cliqué.

## Les extractions nommées

Une action de type Extraction reprend les réglages de l'extraction par défaut, et y ajoute une portée, un filtre et un [gabarit](/fr/concepts/template/) facultatif. Une nouvelle extraction nommée part de la portée *Note active*.

```ts
interface ExtractionAction extends ActionBase {
  kind: "extraction";
  scope: "context" | "note" | "folder-current" | "folder" | "vault";
  folderMenu: boolean;
  folderPath?: string;
  filter: { categories: string[]; since?: string; includeReplies: boolean };
  format: "list" | "table" | "kanban";
  folder: string;
  fileName: string;
  lineTemplate: string;
  template?: string;
  onExisting: "append-new" | "replace";
}
```

### Portée

| Portée | Valeur | Sens |
|---|---|---|
| Note active | `note` | La note active. |
| Note active, ou dossier cliqué | `context` | La note active depuis une commande ou un enchaînement, le dossier depuis le menu d'un dossier. |
| Dossier de la note active | `folder-current` | Le dossier qui contient la note active. |
| Un dossier donné | `folder` | Un dossier fixe (`folderPath`). |
| Tout le coffre | `vault` | Toutes les notes du coffre. |

Quand l'option *Dans le menu des dossiers* (`folderMenu`, sous *Plus d'options* dans le formulaire de l'action) est activée, l'extraction apparaît dans le menu contextuel des dossiers, à côté de l'extraction par défaut. Lancée depuis ce menu, elle porte sur le dossier cliqué, quelle que soit sa portée.

### Filtre

*Catégories* ne garde que les commentaires des catégories listées ; vide, il les garde toutes. *Inclure les réponses* ajoute les réponses.

*Actifs depuis* retient un fil dont la date la plus récente, racine ou réponse, est postérieure au seuil. Un fil relancé par une nouvelle réponse revient donc dans la revue. Le seuil est soit une date (`2026-10-01`), soit une date relative comme `{{date-7d}}`, toujours calculée depuis aujourd'hui.

### Templater

Si le plugin Templater est actif, l'option *Passer par Templater*, sous *Plus d'options*, transmet la note créée à Templater, qui exécute alors les balises `<% … %>` du gabarit. Elle est désactivée par défaut et n'apparaît que si Templater est actif. Voir [Templater](/fr/integrations/templater/).
