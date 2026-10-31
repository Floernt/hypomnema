// Format texte des annotations — fonctions pures, sans dépendance à Obsidian.
//
// Passage commenté :   %%[a1%%texte source%%a1]%%
// Point commenté :     %%[a2%%%%a2]%%   (commentaire posé au curseur, sans sélection)
// Corps (fin de note) :
//   %% annotations
//   [a1] 2026-10-31 #droit-prive Commentaire   (le tag de catégorie est facultatif)
//       suite du commentaire
//     [a1.1] 2026-11-04 Réponse
//   %%

export interface Anchor {
  id: string;
  openFrom: number;
  openTo: number; // début du passage
  closeFrom: number; // fin du passage
  closeTo: number;
}

export interface Entry {
  id: string; // "a1" (racine) ou "a1.1" (réponse)
  date: string;
  tag?: string; // catégorie, notée « #tag » après la date (racines uniquement)
  text: string;
}

export interface Thread {
  id: string;
  root: Entry; // texte vide si le passage est marqué sans commentaire
  replies: Entry[];
  anchor: Anchor | null; // null = commentaire orphelin (marqueurs effacés)
  quote: string; // passage commenté, ou contexte « … avant ▮ après … » pour un point
}

export interface Block {
  from: number; // début de la ligne "%% annotations"
  to: number; // fin de la ligne "%%" fermante
  entries: Entry[];
}

export interface Parsed {
  anchors: Anchor[];
  block: Block | null;
  threads: Thread[];
}

export interface Change {
  from: number;
  to: number;
  insert: string;
}

const OPEN_RE = /%%\[(a\d+)%%/g;
const CLOSE_RE = /%%(a\d+)\]%%/g;
const HEADER_RE = /^%% annotations[ \t]*$/gm;
const ENTRY_RE = /^\s*\[(a\d+(?:\.\d+)?)\]\s+(\d{4}-\d{2}-\d{2})(?: #([^\s#]+))?(?: (.*))?$/;
const CONTEXT = 60;

const ROOT_INDENT = "";
const REPLY_INDENT = "  ";
const CONTINUATION = "    ";

export function parse(doc: string): Parsed {
  const block = parseBlock(doc);
  const anchors = parseAnchors(doc, block);
  return { anchors, block, threads: buildThreads(doc, anchors, block) };
}

function parseBlock(doc: string): Block | null {
  let header: RegExpExecArray | null = null;
  for (const m of doc.matchAll(HEADER_RE)) header = m as RegExpExecArray;
  if (!header) return null;

  const from = header.index;
  const bodyStart = from + header[0].length + 1;
  const closer = /^%%[ \t]*$/m.exec(doc.slice(bodyStart));
  if (!closer) return null;
  const to = bodyStart + closer.index + closer[0].length;

  const body = doc.slice(bodyStart, bodyStart + closer.index).replace(/\r/g, "");
  const entries: Entry[] = [];
  let lines: string[] = [];
  const flush = () => {
    const current = entries[entries.length - 1];
    if (current) current.text = lines.join("\n").trim();
  };
  for (const line of body.split("\n")) {
    const m = ENTRY_RE.exec(line);
    if (m) {
      flush();
      entries.push(m[3] ? { id: m[1], date: m[2], tag: m[3], text: "" } : { id: m[1], date: m[2], text: "" });
      lines = [(m[4] ?? "").replace(/^\\#/, "#")];
    } else if (entries.length) {
      lines.push(line.trim());
    }
  }
  flush();
  return { from, to, entries };
}

function parseAnchors(doc: string, block: Block | null): Anchor[] {
  const outside = (i: number) => !block || i < block.from || i >= block.to;
  const opens = new Map<string, RegExpMatchArray>();
  for (const m of doc.matchAll(OPEN_RE)) {
    if (outside(m.index!) && !opens.has(m[1])) opens.set(m[1], m);
  }
  const anchors: Anchor[] = [];
  for (const m of doc.matchAll(CLOSE_RE)) {
    const open = opens.get(m[1]);
    if (!open || !outside(m.index!) || m.index! < open.index! + open[0].length) continue;
    opens.delete(m[1]);
    anchors.push({
      id: m[1],
      openFrom: open.index!,
      openTo: open.index! + open[0].length,
      closeFrom: m.index!,
      closeTo: m.index! + m[0].length,
    });
  }
  return anchors.sort((a, b) => a.openFrom - b.openFrom);
}

const rootOf = (id: string) => id.split(".")[0];
const num = (s: string) => parseInt(s.replace(/^a/, ""), 10);

function buildThreads(doc: string, anchors: Anchor[], block: Block | null): Thread[] {
  const entries = block?.entries ?? [];
  const byRoot = new Map<string, Thread>();
  const threads: Thread[] = [];

  for (const a of anchors) {
    const t: Thread = {
      id: a.id,
      root: { id: a.id, date: "", text: "" },
      replies: [],
      anchor: a,
      quote: a.closeFrom > a.openTo ? stripMarkers(doc.slice(a.openTo, a.closeFrom)) : pointContext(doc, a),
    };
    byRoot.set(a.id, t);
    threads.push(t);
  }
  const orphans: Thread[] = [];
  const threadFor = (rid: string) => {
    let t = byRoot.get(rid);
    if (!t) {
      t = { id: rid, root: { id: rid, date: "", text: "" }, replies: [], anchor: null, quote: "" };
      byRoot.set(rid, t);
      orphans.push(t);
    }
    return t;
  };
  for (const e of entries) {
    const t = threadFor(rootOf(e.id));
    if (e.id.includes(".")) t.replies.push(e);
    else t.root = e;
  }
  for (const t of byRoot.values()) {
    t.replies.sort((x, y) => num(x.id.split(".")[1]) - num(y.id.split(".")[1]));
  }
  return threads.concat(orphans);
}

/** Quelques mots avant et après un point commenté, sans sortir de sa ligne. */
function pointContext(doc: string, a: Anchor): string {
  const lineStart = doc.lastIndexOf("\n", a.openFrom - 1) + 1;
  const lineEnd = doc.indexOf("\n", a.closeTo);
  const before = stripMarkers(doc.slice(lineStart, a.openFrom));
  const after = stripMarkers(doc.slice(a.closeTo, lineEnd < 0 ? doc.length : lineEnd));
  const b = (before.length > CONTEXT ? "…" : "") + before.slice(-CONTEXT).trim();
  const f = after.slice(0, CONTEXT).trim() + (after.length > CONTEXT ? "…" : "");
  return `${b} ▮ ${f}`.trim();
}

/** Retire les marqueurs d'annotations imbriquées pour afficher un extrait propre. */
export function stripMarkers(s: string): string {
  return s.replace(OPEN_RE, "").replace(CLOSE_RE, "");
}

function sanitize(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/%%/g, "% %").trim();
}

function serializeEntry(e: Entry, indent: string): string {
  const [first, ...rest] = e.text.split("\n");
  const tag = e.tag ? ` #${e.tag}` : "";
  // Un texte qui commence par « # » est échappé pour ne pas être lu comme une catégorie.
  const text = first && !e.tag && first.startsWith("#") ? "\\" + first : first;
  const head = `${indent}[${e.id}] ${e.date}${tag}${text ? " " + text : ""}`;
  return [head, ...rest.map((l) => (l ? indent + CONTINUATION + l : ""))].join("\n");
}

function serializeBlock(threads: Thread[]): string {
  const lines = ["%% annotations"];
  for (const t of threads) {
    if (t.root.date) lines.push(serializeEntry(t.root, ROOT_INDENT));
    for (const r of t.replies) lines.push(serializeEntry(r, REPLY_INDENT));
  }
  lines.push("%%");
  return lines.join("\n");
}

/** Remplace (ou crée, ou supprime) le bloc d'annotations à partir des fils donnés. */
function blockChange(doc: string, block: Block | null, threads: Thread[]): Change[] {
  const hasContent = threads.some((t) => t.root.date || t.replies.length);
  if (!block) {
    if (!hasContent) return [];
    const prefix = doc.length === 0 || doc.endsWith("\n\n") ? "" : doc.endsWith("\n") ? "\n" : "\n\n";
    return [{ from: doc.length, to: doc.length, insert: prefix + serializeBlock(threads) + "\n" }];
  }
  if (!hasContent) {
    let from = block.from;
    let to = block.to;
    while (from > 0 && doc[from - 1] === "\n") from--;
    while (to < doc.length && doc[to] === "\n") to++;
    return [{ from, to, insert: from > 0 ? "\n" : "" }];
  }
  return [{ from: block.from, to: block.to, insert: serializeBlock(threads) }];
}

export function nextId(parsed: Parsed): string {
  let max = 0;
  for (const t of parsed.threads) max = Math.max(max, num(t.id));
  return `a${max + 1}`;
}

export class AnnotationError extends Error {}

/** Pose les marqueurs d'un nouveau commentaire, sans texte (brouillon à compléter par editEntry). */
export function addAnchor(doc: string, from: number, to: number): { id: string; changes: Change[] } {
  const point = from;
  while (from < to && /\s/.test(doc[from])) from++;
  while (to > from && /\s/.test(doc[to - 1])) to--;
  if (from >= to) from = to = point; // rien (ou que des espaces) de sélectionné : commentaire au curseur

  const parsed = parse(doc);
  if (parsed.block && to > parsed.block.from) {
    throw new AnnotationError("Impossible de commenter le bloc d'annotations lui-même.");
  }
  for (const a of parsed.anchors) {
    for (const [s, e] of [[a.openFrom, a.openTo], [a.closeFrom, a.closeTo]]) {
      if ((from > s && from < e) || (to > s && to < e)) {
        throw new AnnotationError("La sélection coupe un marqueur de commentaire existant.");
      }
    }
  }

  const id = nextId(parsed);
  return {
    id,
    changes: [
      { from, to: from, insert: `%%[${id}%%` },
      { from: to, to, insert: `%%${id}]%%` },
    ],
  };
}

export function addComment(doc: string, from: number, to: number, text: string, date: string, tag?: string): { id: string; changes: Change[] } {
  const { id, changes } = addAnchor(doc, from, to);
  const withAnchor = applyChanges(doc, changes);
  // Le bloc est réécrit à partir du document muni des marqueurs, puis réexprimé en positions d'origine.
  const blockChanges = editEntry(withAnchor, id, text, date, tag);
  return { id, changes: changes.concat(shiftToOrigin(doc, withAnchor, blockChanges)) };
}

/** Les changements du bloc portent sur la fin du document, après tous les marqueurs : un simple décalage suffit. */
function shiftToOrigin(doc: string, modified: string, changes: Change[]): Change[] {
  const delta = modified.length - doc.length;
  return changes.map((c) => ({ from: Math.max(c.from - delta, 0), to: c.to - delta, insert: c.insert }));
}

function threadOrder(a: Thread, b: Thread): number {
  if (a.anchor && b.anchor) return a.anchor.openFrom - b.anchor.openFrom || num(a.id) - num(b.id);
  if (a.anchor) return -1;
  if (b.anchor) return 1;
  return num(a.id) - num(b.id);
}

function findThread(parsed: Parsed, id: string): Thread {
  const t = parsed.threads.find((x) => x.id === rootOf(id));
  if (!t) throw new AnnotationError(`Commentaire ${id} introuvable.`);
  return t;
}

export function addReply(doc: string, rootId: string, text: string, date: string): Change[] {
  const parsed = parse(doc);
  const t = findThread(parsed, rootId);
  const n = t.replies.reduce((m, r) => Math.max(m, num(r.id.split(".")[1])), 0) + 1;
  t.replies.push({ id: `${t.id}.${n}`, date, text: sanitize(text) });
  return blockChange(doc, parsed.block, parsed.threads);
}

/** Modifie le texte d'une entrée ; pour une racine, `tag` fixe la catégorie (undefined = aucune). */
export function editEntry(doc: string, id: string, text: string, date: string, tag?: string): Change[] {
  const parsed = parse(doc);
  const t = findThread(parsed, id);
  const entry = id.includes(".") ? t.replies.find((r) => r.id === id) : t.root;
  if (!entry) throw new AnnotationError(`Commentaire ${id} introuvable.`);
  entry.text = sanitize(text);
  if (!id.includes(".")) {
    if (tag) entry.tag = tag;
    else delete entry.tag;
  }
  if (!entry.date) entry.date = date; // passage marqué sans commentaire
  return blockChange(doc, parsed.block, parsed.threads);
}

/** Supprime une réponse, ou un fil entier (marqueurs compris) si l'identifiant est une racine. */
export function deleteEntry(doc: string, id: string): Change[] {
  const parsed = parse(doc);
  const t = findThread(parsed, id);
  if (id.includes(".")) {
    t.replies = t.replies.filter((r) => r.id !== id);
    return blockChange(doc, parsed.block, parsed.threads);
  }
  const changes: Change[] = [];
  if (t.anchor) {
    changes.push(
      { from: t.anchor.openFrom, to: t.anchor.openTo, insert: "" },
      { from: t.anchor.closeFrom, to: t.anchor.closeTo, insert: "" },
    );
  }
  const rest = parsed.threads.filter((x) => x !== t);
  return changes.concat(blockChange(doc, parsed.block, rest));
}

/** Applique des changements exprimés en positions du document d'origine. */
export function applyChanges(doc: string, changes: Change[]): string {
  const sorted = changes.map((c, i) => ({ c, i })).sort((x, y) => x.c.from - y.c.from || x.i - y.i);
  let out = "";
  let pos = 0;
  for (const { c } of sorted) {
    out += doc.slice(pos, c.from) + c.insert;
    pos = c.to;
  }
  return out + doc.slice(pos);
}
