// Gestes : actions de lecture nommées par l'utilisateur (annotation, extraction, enchaînement, groupe).
// Types et fonctions pures, sans dépendance à Obsidian.

import type { ExtractFormat, Source } from "./extract";

export type GesteKind = "annotation" | "extraction" | "chain" | "group";

export interface GesteBase {
  id: string;
  name: string;
  kind: GesteKind;
  /** Enregistre une commande Obsidian « hypomnema:geste-<id> ». */
  command: boolean;
}

export interface AnnotationGeste extends GesteBase {
  kind: "annotation";
  /** Tag de la catégorie, "ask" pour la demander, "" pour aucune. */
  category: string;
  initialText: string;
}

export type ExtractScope = "context" | "note" | "folder-current" | "folder" | "vault";

/** Réglages d'une extraction ; l'extraction par défaut (section Extraction des réglages) a la même forme. */
export interface ExtractionFields {
  scope: ExtractScope;
  folderPath: string;
  folderMenu: boolean;
  /** Tags des catégories retenues ; vide : toutes. */
  categories: string[];
  /** Date AAAA-MM-JJ ou expression comme {{date-7d}} ; vide : pas de limite. */
  since: string;
  includeReplies: boolean;
  format: ExtractFormat;
  folder: string;
  fileName: string;
  lineTemplate: string;
  /** Chemin d'une note-gabarit ; vide : aucune. */
  template: string;
  /** Passe la note créée à Templater, s'il est actif. */
  templater: boolean;
  onExisting: "append-new" | "replace";
}

export interface ExtractionGeste extends GesteBase, ExtractionFields {
  kind: "extraction";
}

export type Step =
  | { type: "geste"; id: string }
  | { type: "command"; id: string }
  | { type: "script"; path: string; settings?: Record<string, string> }
  | { type: "wait"; ms: number };

export interface ChainGeste extends GesteBase {
  kind: "chain";
  steps: Step[];
}

export interface GroupGeste extends GesteBase {
  kind: "group";
  children: string[];
}

export type Geste = AnnotationGeste | ExtractionGeste | ChainGeste | GroupGeste;

export const DEFAULT_EXTRACTION_ID = "default-extraction";

export function newId(existing: Iterable<string> = []): string {
  const taken = new Set(existing);
  let id: string;
  do id = Math.random().toString(36).slice(2, 8);
  while (taken.has(id) || id === DEFAULT_EXTRACTION_ID);
  return id;
}

/** Enchaînements et groupes ne relèvent que des fonctions avancées. */
export function isAdvanced(g: Geste): boolean {
  return g.kind === "chain" || g.kind === "group";
}

/** Gestes appelés directement par un enchaînement ou un groupe. */
function children(g: Geste): string[] {
  if (g.kind === "group") return g.children;
  if (g.kind === "chain") return g.steps.flatMap((s) => (s.type === "geste" ? [s.id] : []));
  return [];
}

/** Vrai si lancer `id` finirait par le relancer lui-même. */
export function hasCycle(id: string, gestes: Geste[]): boolean {
  const byId = new Map(gestes.map((g) => [g.id, g]));
  const visiting = new Set<string>();
  const visit = (cur: string): boolean => {
    if (visiting.has(cur)) return true;
    const g = byId.get(cur);
    if (!g) return false;
    visiting.add(cur);
    const found = children(g).some(visit);
    visiting.delete(cur);
    return found;
  };
  return visit(id);
}

/** Dernière activité d'un fil : la date la plus récente de la racine et des réponses. */
function lastActivity(th: Source["parsed"]["threads"][number]): string {
  return [th.root.date, ...th.replies.map((r) => r.date)].reduce((a, b) => (b > a ? b : a), "");
}

/**
 * Ne garde que les fils retenus par le filtre : catégories (vide : toutes) et date de dernière activité.
 * Les passages marqués sans commentaire sont laissés tels quels : le rendu les ignore déjà.
 */
export function filterSources(sources: Source[], filter: { categories: string[]; since?: string }): Source[] {
  const cats = new Set(filter.categories);
  return sources.map((s) => ({
    ...s,
    parsed: {
      ...s.parsed,
      threads: s.parsed.threads.filter(
        (th) =>
          (!cats.size || (th.root.tag !== undefined && cats.has(th.root.tag))) &&
          (!filter.since || lastActivity(th) >= filter.since),
      ),
    },
  }));
}

export interface ImportResult {
  gestes: Geste[];
  /** Tags de catégorie employés par les gestes importés mais absents des réglages. */
  missingCategories: string[];
}

const KINDS: GesteKind[] = ["annotation", "extraction", "chain", "group"];

/**
 * Lit un export JSON de gestes. Les identifiants déjà pris sont renouvelés, et les renvois
 * entre gestes importés suivent. Lève une erreur si le texte n'est pas un export valide.
 */
export function importGestes(json: string, existing: Geste[], categoryTags: string[]): ImportResult {
  const data: unknown = JSON.parse(json);
  const list = Array.isArray(data) ? data : (data as { gestes?: unknown })?.gestes;
  if (!Array.isArray(list)) throw new Error("not-a-list");
  const taken = new Set(existing.map((g) => g.id));
  const rename = new Map<string, string>();
  const gestes = list.map((raw) => {
    const g = raw as Geste;
    if (!g || typeof g !== "object" || typeof g.name !== "string" || !KINDS.includes(g.kind)) throw new Error("invalid-geste");
    const id = typeof g.id === "string" && g.id && !taken.has(g.id) && g.id !== DEFAULT_EXTRACTION_ID ? g.id : newId(taken);
    if (g.id) rename.set(g.id, id);
    taken.add(id);
    return { ...g, id, command: g.command !== false } as Geste;
  });
  for (const g of gestes) {
    if (g.kind === "group") g.children = g.children.map((c) => rename.get(c) ?? c);
    if (g.kind === "chain") g.steps = g.steps.map((s) => (s.type === "geste" ? { ...s, id: rename.get(s.id) ?? s.id } : s));
  }
  const known = new Set(categoryTags);
  const missing = new Set<string>();
  for (const g of gestes) {
    const tags = g.kind === "annotation" ? [g.category] : g.kind === "extraction" ? g.categories : [];
    for (const t of tags) if (t && t !== "ask" && !known.has(t)) missing.add(t);
  }
  return { gestes, missingCategories: [...missing] };
}

export function exportGestes(gestes: Geste[]): string {
  return JSON.stringify({ hypomnema: 1, gestes }, null, 2);
}
