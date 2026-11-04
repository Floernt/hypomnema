---
title: API
description: L'API publique et les événements, pour les scripts, QuickAdd, Templater et DataviewJS.
sidebar:
  order: 2
---

:::note
Disponible à partir de la version 0.5.0.
:::

L'API est accessible partout où l'objet `app` d'Obsidian l'est : un script QuickAdd, `tp.app` dans Templater, un bloc DataviewJS, un autre plugin.

```js
const api = app.plugins.plugins.hypomnema?.api;
```

Vérifiez que `api` existe avant de vous en servir : le plugin peut être désactivé.

## Fonctions

```ts
api.version                                  // "1"
api.threads(file: TFile): Promise<Thread[]>
api.allThreads(opts?: { folder?: string; categories?: string[]; since?: string }): Promise<{ file: TFile; thread: Thread }[]>
api.addComment(file, target: { quote: string; occurrence?: number } | { line: number }, text: string, tag?: string): Promise<string>
api.reply(file, id, text): Promise<void>
api.runAction(id: string, vars?: Record<string, string>): Promise<void>
api.format(template: string, vars?: Record<string, string>): string
```

**`threads`** renvoie les fils d'une note. **`allThreads`** renvoie les fils d'un dossier, ou du coffre entier, filtrés par tags de catégorie et par une date `since` (`AAAA-MM-JJ`), comme pour une [extraction](/fr/concepts/extraction/#filtre).

Un `Thread` comporte un identifiant `id` (`a1`), une entrée racine `root` et ses réponses `replies` (chacune avec `id`, `date`, `tag` pour la racine, et `text`), le passage commenté `quote`, et une ancre `anchor`, qui vaut `null` quand les marqueurs ont été supprimés.

**`addComment`** ajoute un commentaire et renvoie son identifiant. La cible est soit un passage, `{ quote }`, soit une ligne, `{ line }`. Avec `{ line }`, comptée à partir de 0, le commentaire est un commentaire au curseur placé en fin de ligne. Avec `{ quote }`, si le passage est absent ou apparaît plusieurs fois, l'appel lève une erreur explicite, sauf si `occurrence: n` désigne lequel (à partir de 1). L'API ne choisit jamais en silence.

**`reply`** ajoute une réponse à un fil. **`runAction`** lance une [action](/fr/concepts/actions/) par son identifiant ; `vars` préremplit ses invites `{{VALUE:…}}`. **`format`** résout la [syntaxe des variables](/fr/concepts/variables/) dans une chaîne ; les entrées de `vars` répondent aussi aux invites `{{VALUE:…}}` : `api.format("Revue {{VALUE:sujet}}", { sujet: "mémoire" })` donne `Revue mémoire`.

Une écriture par l'API a les mêmes effets qu'une écriture depuis l'interface : le tag de catégorie est synchronisé dans les propriétés de la note, et l'événement `hypomnema:comment-added` est déclenché, que la note soit ouverte ou non. Les écritures passent par `vault.process` et n'entrent donc pas en conflit avec l'éditeur.

## Exemple

```js
const api = app.plugins.plugins.hypomnema.api;
const file = app.workspace.getActiveFile();
const id = await api.addComment(file, { quote: "la mémoire est une reconstruction" }, "Comparer avec Bartlett, 1932.", "a-verifier");
await api.reply(file, id, "Vérifié : chapitre 10.");
```

## Événements

Hypomnema déclenche trois événements sur `app.workspace`. Chaque gestionnaire reçoit un seul objet. Un script ou un autre plugin s'y abonne avec `app.workspace.on` :

| Événement | Quand | Contenu |
|---|---|---|
| `hypomnema:comment-added` | Un commentaire ou une réponse est ajouté, depuis l'interface ou l'API. | `{ file: TFile, id, text, tag? }` ; pour une réponse, `id` vaut `aN.k` |
| `hypomnema:comment-edited` | Un commentaire est modifié. | `{ file: TFile, id, text, tag? }` |
| `hypomnema:extracted` | Une extraction a écrit sa note. | `{ file: TFile, added: number, sources: string[] }` : la note d'extraction, le nombre de commentaires ajoutés, les chemins des notes sources |

```js
const ref = app.workspace.on("hypomnema:extracted", (d) => {
  console.log(`${d.added} commentaire(s) extrait(s) dans ${d.file.path} depuis ${d.sources.join(", ")}`);
});
// plus tard : app.workspace.offref(ref);
```
