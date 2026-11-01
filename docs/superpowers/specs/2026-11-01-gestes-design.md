# Hypomnema : gestes, personnalisation et site de documentation — spec

*2026-11-01. Concepts transposés de [QuickAdd](https://quickadd.obsidian.guide/docs). Statut : à relire par Florian.*

## Contexte

Florian veut une logique de personnalisation équivalente à celle de QuickAdd (https://quickadd.obsidian.guide/docs). QuickAdd s'organise autour de choix (Template, Capture, Macro, Multi), d'une syntaxe de variables `{{…}}`, de variables globales, de scripts utilisateur, d'une API, de paquets partageables et d'un URI. La demande : définir les concepts équivalents pour hypomnema, en écrire les specs, et prévoir un site de documentation du même type que QuickAdd Docs.

Le fil conducteur vient de la session précédente : l'individuation au sens de Stiegler. Le lecteur se forge sa propre « grammaire de lecture » au lieu de subir celle de l'outil. Aujourd'hui, le plugin n'a qu'un jeu de réglages : catégories, affichage, une seule configuration d'extraction ([src/settings.ts:11-32](src/settings.ts#L11-L32)).

Exigences posées par Florian :

- **Noms** : les gestes s'appellent simplement Annotation et Extraction.
- **Scripts et macros** : on les propose à l'utilisateur comme des possibilités ouvertes, sans les exclure.
- **Lisibilité** : les couches de personnalisation ne doivent pas s'empiler de façon illisible. L'usage reste léger par défaut, et la profondeur n'apparaît que si l'utilisateur la cherche.
- **Méthode** : chaque fonction s'accompagne d'une note méthodologique qui explique l'idée derrière elle. Le lecteur peut s'en inspirer, se l'approprier ou la modifier.

## Intention

QuickAdd fait de l'utilisateur l'auteur de ses propres flux de capture. Hypomnema transpose cette idée à l'annotation : l'utilisateur définit ses **gestes** de lecture, les nomme et les déclenche comme des commandes Obsidian. Un geste peut être une manière d'annoter, une manière d'extraire, ou un enchaînement des deux. Chaque geste est accompagné de la méthode qui le fonde, pour que l'utilisateur comprenne ce qu'il configure et puisse inventer la sienne.

## Principe directeur : léger par défaut, profond à la demande

Trois niveaux, dont chacun n'apparaît que si l'utilisateur va le chercher.

| Niveau | Ce que voit l'utilisateur | Pour qui |
|---|---|---|
| 1. Usage | Commenter, catégories, marge, extraction par défaut. Rien à configurer. | Tout le monde |
| 2. Gestes | Section *Gestes* : annotations et extractions nommées, variables globales | Qui a une méthode de lecture à outiller |
| 3. Avancé | Enchaînements, groupes, scripts, API, URI, export/import | Qui veut programmer son flux |

Règles qui en découlent :

- Le niveau 3 est masqué derrière un interrupteur *Fonctions avancées*, désactivé par défaut. Les gestes avancés existants restent exécutables même quand il est masqué.
- Chaque section des réglages porte une phrase d'explication et un lien *Méthode* vers la note méthodologique du site. Aucun long texte dans l'interface.
- Un geste se crée par un formulaire court : nom, type, puis les seuls champs utiles à ce type. Les champs facultatifs sont repliés sous *Plus d'options*.
- Sans geste défini, le plugin se comporte exactement comme aujourd'hui.

## Objectifs, non-objectifs, anti-objectifs

- **Objectifs** :
  - l'interopérabilité avec Dataview, QuickAdd, Templater, Kanban et Tasks (§ 11), sans jamais en dépendre ;
  - des gestes nommés et configurables, avec une syntaxe de variables unique ;
  - des extractions multiples ;
  - des enchaînements avec scripts facultatifs ;
  - une API ;
  - un site de documentation qui fait place à la méthode autant qu'au mode d'emploi.
- **Non-objectif** : refaire QuickAdd à l'identique. Hypomnema propose ce qui touche l'annotation. Pour les scripts, il suit les conventions de QuickAdd (même signature de fonction), afin qu'un utilisateur passe de l'un à l'autre sans réapprendre.
- **Anti-objectifs** (échec même si ça marche) :
  - aucun assistant IA ni texte de commentaire généré : le commentaire reste écrit par le lecteur. L'« AI Assistant » de QuickAdd est délibérément écarté ;
  - une interface qui devient un tableau de bord à options : si le niveau 1 se complique, c'est raté ;
  - un format de stockage modifié (`%%[aN%%…%%aN]%%` et le bloc `%% annotations` restent tels quels).

## Correspondance des concepts

| QuickAdd | Hypomnema | Niveau | Rôle |
|---|---|---|---|
| Choice | **Geste** | 2 | Action nommée, exposée comme commande Obsidian |
| Capture | **Annotation** | 2 | Commenter avec une catégorie et un texte de départ préréglés |
| Template | **Extraction** | 2 | Extraire selon une portée, un filtre, un format et un gabarit |
| Format syntax | **Syntaxe des variables** | 2 | `{{…}}` commune à tous les gestes |
| Global variables | **Variables globales** | 2 | Valeurs nommées réutilisables |
| Template file | **Gabarit** | 2 | Note du coffre servant de squelette à une extraction |
| Macro | **Enchaînement** | 3 | Suite d'étapes : gestes, commandes, scripts, pauses |
| Multi | **Groupe** | 3 | Menu qui regroupe des gestes |
| User scripts | **Script** | 3 | Fichier `.js` du coffre exécuté dans un enchaînement |
| API | **API publique** | 3 | `app.plugins.plugins.hypomnema.api` |
| Obsidian URI | **URI** `obsidian://hypomnema?geste=…` | 3 | Lancer un geste de l'extérieur |
| Packages | **Export / import** | 3 | Partager ses gestes en JSON |

## 1. Geste (concept commun)

```ts
interface GesteBase { id: string; name: string; kind: "annotation" | "extraction" | "chain" | "group"; command: boolean; }
```

- `id` est stable, généré à la création. Il sert d'identifiant de commande `hypomnema:geste-<id>`, ce qui donne accès aux raccourcis, à la palette, à QuickAdd (étape *Obsidian command*) et à l'URI.
- Ajout ou suppression d'un geste : la commande est ajoutée ou retirée à chaud (`addCommand` / `Plugin.removeCommand`, disponible depuis 1.7.2, la `minAppVersion` actuelle).
- La commande fixe *Hypomnema : lancer un geste* ouvre un `FuzzySuggestModal` qui liste tous les gestes.

## 2. Annotation (≈ Capture)

```ts
interface AnnotationGeste extends GesteBase { kind: "annotation"; category: string | "ask" | ""; initialText: string; }
```

- Même comportement que *Commenter la sélection ou le curseur*, à deux différences près : la rédaction s'ouvre avec la catégorie choisie, et le champ est prérempli par `initialText`. Les variables y sont résolues, et le curseur se place à `{{cursor}}` ou, à défaut, à la fin.
- Catégorie :
  - `"ask"` affiche un sélecteur de catégorie avant la rédaction ;
  - `""` crée le commentaire sans catégorie.
- Exemples donnés dans la doc, pas créés par défaut :
  - « Objection » : `#objection`, texte de départ « Objection : » ;
  - « À vérifier » : `#a-verifier`, texte de départ « Vérifier {{VALUE:quoi ?}} ».
- Réutilise `Actions.startDraft` ([src/actions.ts:49](src/actions.ts#L49)) et `ComposeRequest` ([src/ui.ts:13](src/ui.ts#L13)), auxquels on ajoute `tag?` et `initialText?`. La catégorie et le texte du brouillon vivent aujourd'hui dans la vue de rédaction du panneau ([src/sidePanel.ts](src/sidePanel.ts)) : le préremplissage s'y branche.

## 3. Extraction (≈ Template)

```ts
interface ExtractionGeste extends GesteBase {
  kind: "extraction";
  scope: "context" | "note" | "folder-current" | "folder" | "vault";
  folderMenu: boolean;               // proposée dans le menu des dossiers
  folderPath?: string;
  filter: { categories: string[]; since?: string; includeReplies: boolean };
  format: ExtractFormat; folder: string; fileName: string; lineTemplate: string;
  template?: string;
  onExisting: "append-new" | "replace";
}
```

- **Migration** : les réglages `extract` actuels deviennent l'extraction « Extraction » (`id: "default-extraction"`, portée `context`). La commande `extract-note` et le menu des dossiers l'utilisent, et leurs identifiants ne changent pas.
- **Portée `context`** : la portée vient du point d'appel. Depuis une commande ou un enchaînement, c'est la note active ; depuis le menu d'un dossier, c'est ce dossier. *(Mon choix.)*
- **L'extraction par défaut** se règle dans la section Extraction de niveau 1 (ses options supplémentaires sous *Plus d'options*) et n'apparaît pas dans la liste des gestes. Elle ne peut être ni renommée ni supprimée, ce qui garantit que `extract-note` fonctionne toujours. *(Mon choix.)*
- **Menu des dossiers** : il propose l'extraction par défaut, plus les autres extractions qui ont `folderMenu: true`. *(Mon choix.)*
- **Filtre `since`** : il retient un fil dont la date la plus récente (racine ou réponse) est postérieure au seuil, si bien qu'un fil relancé par une réponse revient dans la revue. Le seuil est soit une date, soit `{{date-7d}}`, toujours calculé depuis aujourd'hui. *(Mon choix.)*
- Réutilise `renderExtraction` et `mergeNew` ([src/extract.ts:157-170](src/extract.ts#L157-L170)). Une fonction pure `filterSources` s'applique en amont, sur les catégories, `since` et les réponses.
- La portée `vault` reprend la collecte d'`extractFolder` à partir de la racine.

## 4. Gabarit

- Le gabarit est une note du coffre, par exemple `Gabarits/Revue de lecture.md`. Elle contient du texte libre et des variables, dont `{{comments}}` (le corps de l'extraction) et `{{sources}}` (des liens vers les notes sources).
- Il vaut pour les formats liste et tableau. Pour Kanban, il est ignoré et un avertissement l'indique dans le formulaire : la structure attendue par le plugin Kanban est trop stricte. *(Mon choix.)*
- En `append-new`, le gabarit ne sert qu'à la création ; les ajouts suivants passent par `mergeNew`.
- **Propriétés** : celles du gabarit sont gardées, et les propriétés `hypomnema-*` et `tags` d'hypomnema y sont ajoutées. Les tags sont fusionnés et dédoublonnés. *(Mon choix.)*
- **Repères** : `{{comments}}` est rendu entre deux commentaires Obsidian invisibles, `%% hypomnema:start %%` et `%% hypomnema:end %%`. Le texte du gabarit placé après le bloc ne gêne donc pas `mergeNew`, qui insère avant `hypomnema:end`. Si les repères ont disparu, `mergeNew` ajoute en fin de note, comme aujourd'hui. Ces repères concernent la note d'extraction, pas le format de stockage des annotations. *(Mon choix.)*

## 5. Enchaînement (≈ Macro), script et groupe (≈ Multi)

```ts
type Step =
  | { type: "geste"; id: string }
  | { type: "command"; id: string }
  | { type: "script"; path: string; settings?: Record<string, string> }
  | { type: "wait"; ms: number };
interface ChainGeste extends GesteBase { kind: "chain"; steps: Step[]; }
interface GroupGeste extends GesteBase { kind: "group"; children: string[]; }
```

- Les étapes s'exécutent dans l'ordre et s'arrêtent à la première erreur, signalée par une Notice. Les variables `{{VALUE:…}}` saisies dans une étape restent disponibles pour les suivantes.
- **Script** : un fichier `.js` du coffre exporte `module.exports = async (params, settings) => {}`, sur le modèle de QuickAdd. `params` contient `{ app, api, variables }`, où `variables` est lisible et modifiable. Règles :
  - les scripts ne sont visibles qu'au niveau 3 ;
  - le premier lancement d'un script demande une confirmation qui nomme le fichier ;
  - la doc avertit qu'un script a les mêmes droits que le plugin.
  - *Risque* : la relecture du catalogue Obsidian examine l'exécution de code. QuickAdd y est accepté avec le même mécanisme. À vérifier avant le lot 3.
- **Groupe** : il ouvre un `FuzzySuggestModal` qui liste ses enfants. Une détection de cycle empêche un enchaînement ou un groupe de s'appeler lui-même.

## 6. Syntaxe des variables

Un module pur `src/format.ts`, testé, centralise les substitutions aujourd'hui dispersées (gabarit de ligne, nom de fichier). `t()` n'est pas concerné.

- **Par commentaire** (existant) : `{{text}} {{quote}} {{tag}} {{category}} {{date}} {{note}} {{link}} {{id}}`.
- **Contexte** : `{{note}}`, `{{selection}}`, `{{cursor}}` (annotation seulement), `{{sources}}`, `{{comments}}`.
- **Dates** : `{{date}}` (AAAA-MM-JJ), `{{date:FORMAT}}` via le `moment` d'Obsidian, `{{date-7d}}` et `{{date+1d}}`.
- **Saisie** : `{{VALUE:libellé}}` ouvre une invite. Un même libellé garde la même valeur dans tout le geste.
- **Globales** : `{{GLOBAL:nom}}`.
- Une variable inconnue est laissée telle quelle, comme aujourd'hui.
- **Contextes emboîtés** : les gabarits actuels donnent déjà deux sens à `{{date}}` et à `{{note}}`. Pour ne rien changer aux extractions existantes, le contexte le plus proche l'emporte :
  - dans le gabarit de ligne, `{{date}}` et `{{date:FORMAT}}` désignent la date du commentaire, et `{{note}}` le lien vers la note source ([src/extract.ts:63-74](src/extract.ts#L63-L74)) ;
  - ailleurs (nom de fichier, gabarit, annotation), `{{date}}` est la date du jour et `{{note}}` le nom de la note ou du dossier ([src/actions.ts:196](src/actions.ts#L196)) ;
  - la nouvelle variable `{{today}}` (et `{{today:FORMAT}}`) désigne toujours la date du jour ;
  - `{{date-7d}}` est toujours calculé depuis aujourd'hui.

  *(Mon choix.)*
- **Analyseur** : la fonction `fill()` actuelle ne reconnaît que `\{\{(\w+)\}\}`. `format.ts` la remplace par un analyseur qui comprend aussi `nom:argument` et `nom±Nd`.

## 7. Variables globales

Une liste de paires nom → valeur dans la section Gestes, par exemple `lecteur = F. Ernotte` ou `dossier-revue = Revues`. Une valeur peut elle-même contenir des variables, comme `{{date}}`.

## 8. API publique

```ts
api.version                                  // "1"
api.threads(file: TFile): Promise<Thread[]>
api.allThreads(opts?: { folder?: string; categories?: string[]; since?: string }): Promise<{ file: TFile; thread: Thread }[]>
api.addComment(file, target: { quote: string; occurrence?: number } | { line: number }, text: string, tag?: string): Promise<string>
api.reply(file, id, text): Promise<void>
api.runGeste(id: string, vars?: Record<string, string>): Promise<void>
api.format(template: string, vars?: Record<string, string>): string
```

- L'écriture passe par `vault.process` et les fonctions pures de [src/syntax.ts](src/syntax.ts) : `addComment`, `addReply`, `applyChanges`.
- `addComment` avec `{ quote }` : si le passage est absent ou apparaît plusieurs fois, l'appel lève une erreur explicite, sauf si `occurrence: n` désigne laquelle (à partir de 1). L'API ne choisit jamais en silence. *(Mon choix.)*
- Une écriture par l'API a les mêmes effets qu'une écriture depuis l'interface : synchronisation des tags (`syncTags`, `addedTags`) et événement `hypomnema:comment-added`, que la note soit ouverte ou non.
- La même API sert aux scripts d'hypomnema, aux scripts QuickAdd, à Templater et à dataviewjs.

## 9. URI

`obsidian://hypomnema?geste=<id>&<variable>=<valeur>` lance un geste. Les paramètres préremplissent les `{{VALUE:…}}` de même nom. Le lien de retour actuel (`file=…&id=aN`) ne change pas.

## 10. Export / import

- **Export** : copie les gestes choisis en JSON dans le presse-papiers.
- **Import** : colle un JSON. Les ids sont régénérés en cas de collision, et les catégories manquantes sont signalées sans être créées.
- Les chemins de scripts sont exportés tels quels, sans le code.

## 11. Interopérabilité avec les autres plugins

Principe : hypomnema s'appuie sur ce qui existe (Dataview, QuickAdd, Templater, Kanban, Tasks) pour enchaîner les plugins, au lieu de refaire ce qu'ils font déjà. C'est un potentiel ouvert, jamais une condition.

- **Aucune dépendance obligatoire.** Toute fonction marche sans les autres plugins. Une intégration ne s'active que si le plugin concerné est détecté (`app.plugins.enabledPlugins.has(…)`) et ne casse rien s'il est absent.
- **Formats compris de tous.** Les sorties restent du markdown standard :
  - `- [ ]` pour les cartes, que Kanban et Tasks reconnaissent ;
  - des propriétés YAML pour Dataview ;
  - des tags.
  Un gabarit de ligne d'exemple ajoute des champs en ligne Dataview (`categorie:: {{category}}`) : c'est une variante documentée, pas le comportement par défaut.
- **Points d'entrée pour les autres plugins :**
  - une commande par geste, appelable depuis une macro QuickAdd ou un bouton ;
  - l'API publique (§ 8), utilisable depuis un script QuickAdd, `tp.app` dans Templater ou un bloc dataviewjs ;
  - l'URI (§ 9) ;
  - des événements `app.workspace.trigger("hypomnema:comment-added" | "hypomnema:comment-edited" | "hypomnema:extracted", …)`, auxquels un script ou un autre plugin peut s'abonner pour réagir. Exemple : consigner chaque extraction dans un journal.
- **Templater, en option :** si Templater est actif, une case du formulaire d'Extraction (*Plus d'options*) passe la note créée à Templater, ce qui fait exécuter ses balises `<% … %>` dans le gabarit. Elle est désactivée par défaut et invisible sans Templater.
- **Suggestions discrètes :** quand Dataview ou QuickAdd est détecté, la section concernée affiche une ligne « Voir les recettes Dataview / QuickAdd », qui renvoie au site. Pas de fenêtre, pas d'invite.
- **Site :** une rubrique *Intégrations*, avec une page par plugin. Chaque page indique ce que le plugin apporte, la recette minimale et une variante. Elle reprend et étend [docs/recipes.md](docs/recipes.md).

## Réglages et interface

- Ordre des sections :
  - Catégories et Affichage (niveau 1, inchangés) ;
  - Extraction (niveau 1 : l'extraction par défaut, comme aujourd'hui) ;
  - Gestes (niveau 2 : liste et variables globales) ;
  - interrupteur *Fonctions avancées*, puis la section Avancé (niveau 3 : export/import, URI d'un geste copiable).
- Liste des gestes : nom, type et case « commande », avec les boutons monter, descendre, modifier et supprimer, plus « Ajouter un geste ». L'édition se fait dans une fenêtre par type. Les types Enchaînement et Groupe n'apparaissent que si les fonctions avancées sont actives.
- Chaque section commence par une phrase d'explication et un lien *Méthode*, qui pointe vers la note méthodologique du site dans la langue de l'interface.
- Chemin hérité (`renderLegacy`) : complet.
- Chemin déclaratif (1.13+) : la liste des gestes utilise `SettingDefinitionList`, qui gère `onReorder`, `onDelete`, `emptyState` et `SettingDefinitionAddItem`. Les boutons (export, import) passent par `SettingDefinitionAction`. Il n'existe pas de contrôle « bouton » parmi les `SettingControl`.
- `mergeSettings` ajoute `gestes: []`, `globals: {}` et `advanced: false`. La migration de `extract` est faite sans perte.
- Toutes les chaînes existent en EN et en FR dans [src/i18n.ts](src/i18n.ts).

## Notes méthodologiques

Chaque fonction de niveau 2 et 3 a sa note, ainsi que la marge et l'extraction déjà livrées. Une note suit le même plan :

1. **L'idée** : la pratique de lecture que la fonction outille.
2. **Un exemple vécu** : une lecture concrète, du passage annoté au résultat.
3. **Le réglage** : la configuration qui correspond.
4. **Variantes** : comment l'adapter ou la détourner.

Premières notes prévues (titres de travail) :

- annoter par catégories (sa propre taxinomie de lecture) ;
- l'objection et la vérification (deux gestes d'annotation) ;
- la marge (lire avec ses commentaires sous les yeux) ;
- la revue périodique (une extraction filtrée « depuis 7 jours » vers un Kanban) ;
- de la lecture à l'écriture (un gabarit d'extraction qui sert de premier jet de note) ;
- la fin de lecture (un enchaînement : extraction, journal de lecture, script).

Le texte des notes et les phrases sur l'individuation reviennent à Florian. Je fournis la structure, les exemples techniques et un brouillon signalé comme tel.

## Site de documentation

- **But** : l'équivalent de quickadd.obsidian.guide, bilingue EN/FR, dans le dépôt.
- **Outil** : Starlight (Astro). Il apporte l'i18n intégrée, la recherche locale et un thème sobre, avec moins de configuration que Docusaurus, que QuickAdd utilise. *(Mon choix.)*
- **Emplacement** : dossier `site/` dans le dépôt, publié sur GitHub Pages par une GitHub Action. Domaine : `hypomnema.tools` (fichier `CNAME` dans `site/public/`, base `/`, HTTPS forcé, domaine vérifié dans les réglages GitHub).
- **Arborescence** (calquée sur QuickAdd Docs) :
  - Prise en main : installation, premier commentaire, visite (la visite actuelle du README y migre) ;
  - Concepts : geste, annotation, extraction, gabarit, variables, enchaînement, groupe ;
  - Méthode : les notes méthodologiques ;
  - Intégrations : Dataview, QuickAdd, Templater, Kanban, Tasks ([docs/recipes.md](docs/recipes.md) y migre) ;
  - Avancé : scripts, API, URI, format de stockage ;
  - Référence : table des variables, liste des commandes.
- **Images** : les captures et GIF restent produits par `scripts/capture.mjs` dans `docs/screenshots/`, et le site les référence.
- **README** : il garde une visite courte et renvoie au site.
- Une page de doc est livrée avec chaque fonction, dans le même lot.

## Découpage en lots (chacun publiable seul)

1. **Lot 0, site** : squelette Starlight, migration de la visite et des recettes, Action de publication, notes « catégories » et « marge ».
2. **Lot 1, socle** : `format.ts`, variables globales, annotations, commande « lancer un geste », API en lecture et `format`, événements `hypomnema:*`, détection des plugins et suggestions discrètes, notes correspondantes.
3. **Lot 2, extraction** : extractions multiples (portée, filtre, gabarit), migration, `runGeste`, option Templater, notes « revue périodique » et « de la lecture à l'écriture ».
4. **Lot 3, avancé** : interrupteur, enchaînements, scripts, groupes, URI `geste=`, export/import, API en écriture, note « fin de lecture ».

Chaque lot comprend :

- les tests vitest des modules purs ;
- les captures ou GIF ;
- les pages du site ;
- une entrée dans le CHANGELOG sous `[Non publié]`.

## Ce qui reste à Florian

- Le texte des notes méthodologiques et les phrases qui rattachent chaque fonction à l'individuation.
- Le vocabulaire : « geste » comme terme générique, « enchaînement ».

---
