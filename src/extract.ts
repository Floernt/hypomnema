// Extraction des commentaires vers une note — fonctions pures, sans dépendance à Obsidian.
//
// Trois formats : liste (une section par catégorie), tableau, ou tableau Kanban (format markdown du
// plugin Kanban : une colonne « ## » par catégorie, des cartes « - [ ] »). Chaque commentaire porte un
// lien obsidian://hypomnema?file=…&id=aN qui ramène au passage ; ce lien sert aussi de clé pour
// n'ajouter, lors d'une nouvelle extraction, que les commentaires absents de la note.

import type { Parsed, Thread } from "./syntax";
import { format } from "./format";

export type ExtractFormat = "list" | "table" | "kanban";

export interface Source {
  path: string; // chemin dans le coffre, extension comprise
  basename: string;
  parsed: Parsed;
}

export interface ExtractOptions {
  format: ExtractFormat;
  lineTemplate: string;
  includeReplies: boolean;
  categories: { name: string; tag: string }[];
  date: string; // date de l'extraction (AAAA-MM-JJ)
  vault?: string;
  globals?: Record<string, string>;
  values?: Record<string, string>;
  formatDate?: (iso: string, format: string) => string;
  labels: {
    uncategorized: string;
    done: string;
    columns: [note: string, category: string, date: string, passage: string, comment: string, link: string];
  };
}

interface Item {
  key: string;
  text: string;
}

interface Section {
  heading: string;
  items: Item[];
}

export function backLink(path: string, id: string, vault?: string): string {
  const v = vault ? `vault=${encodeURIComponent(vault)}&` : "";
  return `[↩](obsidian://hypomnema?${v}${linkKey(path, id)})`;
}

/** Partie du lien qui identifie un commentaire, quel que soit le coffre. */
function linkKey(path: string, id: string): string {
  return `file=${encodeURIComponent(path)}&id=${id}`;
}

const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

/** Gabarit de ligne : {{date}} y désigne la date du commentaire, {{today}} celle de l'extraction. */
function fill(template: string, v: Record<string, string>, opts: ExtractOptions): string {
  return format(template, { vars: v, date: v.date, today: opts.date, globals: opts.globals, values: opts.values, formatDate: opts.formatDate });
}

function categoryName(opts: ExtractOptions, tag?: string): string {
  if (!tag) return opts.labels.uncategorized;
  return opts.categories.find((c) => c.tag === tag)?.name || `#${tag}`;
}

function vars(src: Source, th: Thread, opts: ExtractOptions): Record<string, string> {
  return {
    text: th.root.text,
    quote: oneLine(th.quote),
    tag: th.root.tag ? `#${th.root.tag}` : "",
    category: categoryName(opts, th.root.tag),
    date: th.root.date,
    note: `[[${src.path.replace(/\.md$/, "")}|${src.basename}]]`,
    link: backLink(src.path, th.id, opts.vault),
    id: th.id,
  };
}

/** Lignes de suite d'un élément de liste : indentées pour rester dans l'élément. */
function indentRest(s: string, compact: boolean): string {
  const text = compact ? s.replace(/\n\s*\n/g, "\n") : s;
  return text.replace(/\n/g, "\n  ").replace(/\n {2}(?=\n)/g, "\n");
}

function listItem(src: Source, th: Thread, opts: ExtractOptions): string {
  const kanban = opts.format === "kanban";
  let out = (kanban ? "- [ ] " : "- ") + indentRest(fill(opts.lineTemplate, vars(src, th, opts), opts).trim(), kanban);
  if (opts.includeReplies) {
    for (const r of th.replies) {
      const reply = indentRest(`${r.date} ${r.text}`, kanban);
      out += kanban ? `\n  ↳ ${reply}` : `\n  - ${indentRest(reply, false)}`;
    }
  }
  return out;
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

function tableRow(src: Source, th: Thread, opts: ExtractOptions): string {
  const v = vars(src, th, opts);
  let comment = th.root.text;
  if (opts.includeReplies) for (const r of th.replies) comment += `\n↳ ${r.date} ${r.text}`;
  return `| ${[v.note, v.category, v.date, v.quote, comment, v.link].map(cell).join(" | ")} |`;
}

function tableHeader(opts: ExtractOptions): string {
  const cols = opts.labels.columns;
  return `| ${cols.join(" | ")} |\n|${cols.map(() => " --- ").join("|")}|`;
}

/** Commentaires enregistrés (les passages marqués sans texte sont ignorés), groupés par catégorie. */
function sections(sources: Source[], opts: ExtractOptions): Section[] {
  const groups = new Map<string, Item[]>();
  for (const c of opts.categories) groups.set(categoryName(opts, c.tag), []);
  const order: string[] = [...groups.keys()];
  const extra: string[] = [];
  for (const src of sources) {
    for (const th of src.parsed.threads) {
      if (!th.root.date) continue;
      const heading = opts.format === "table" ? "" : categoryName(opts, th.root.tag);
      if (!groups.has(heading)) {
        groups.set(heading, []);
        extra.push(heading);
      }
      const text = opts.format === "table" ? tableRow(src, th, opts) : listItem(src, th, opts);
      groups.get(heading)!.push({ key: linkKey(src.path, th.id), text });
    }
  }
  // Ordre : catégories des réglages, puis tags inconnus, puis « Sans catégorie ».
  const unc = opts.labels.uncategorized;
  const all = [...order, ...extra.filter((h) => h !== unc), ...(groups.has(unc) && !order.includes(unc) ? [unc] : [])];
  const out = all.map((heading) => ({ heading, items: groups.get(heading)! }));
  if (opts.format === "kanban") return out.concat({ heading: opts.labels.done, items: [] });
  return out.filter((s) => s.items.length);
}

function frontmatter(sources: Source[], opts: ExtractOptions): string {
  const tags = new Set<string>();
  for (const s of sources) for (const th of s.parsed.threads) if (th.root.date && th.root.tag) tags.add(th.root.tag);
  const lines = ["---", "hypomnema-extract: true", "hypomnema-source:"];
  for (const s of sources) lines.push(`  - "[[${s.path.replace(/\.md$/, "").replace(/"/g, '\\"')}]]"`);
  lines.push(`hypomnema-date: ${opts.date}`);
  if (tags.size) lines.push("tags:", ...[...tags].map((t) => `  - ${t}`));
  if (opts.format === "kanban") lines.push("kanban-plugin: board");
  lines.push("---");
  return lines.join("\n");
}

function renderSection(s: Section, opts: ExtractOptions): string {
  if (opts.format === "table") return [tableHeader(opts), ...s.items.map((i) => i.text)].join("\n");
  const body = s.items.map((i) => i.text).join("\n");
  return body ? `## ${s.heading}\n\n${body}\n` : `## ${s.heading}\n`;
}

export function countComments(sources: Source[]): number {
  return sources.reduce((n, s) => n + s.parsed.threads.filter((t) => t.root.date).length, 0);
}

/** Les commentaires au format choisi, sans les propriétés. */
export function renderBody(sources: Source[], opts: ExtractOptions): string {
  const secs = sections(sources, opts);
  if (opts.format === "table") return `${renderSection({ heading: "", items: secs.flatMap((s) => s.items) }, opts)}\n`;
  return secs.map((s) => renderSection(s, opts)).join("\n");
}

/** Note complète : propriétés, puis les commentaires au format choisi. */
export function renderExtraction(sources: Source[], opts: ExtractOptions): string {
  return `${frontmatter(sources, opts)}\n\n${renderBody(sources, opts)}`;
}

/** Propriétés d'une note d'extraction, à fusionner avec celles d'un gabarit. */
export function extractionProperties(sources: Source[], opts: ExtractOptions): { source: string[]; date: string; tags: string[] } {
  const tags = new Set<string>();
  for (const s of sources) for (const th of s.parsed.threads) if (th.root.date && th.root.tag) tags.add(th.root.tag);
  return { source: sources.map((s) => `[[${s.path.replace(/\.md$/, "")}]]`), date: opts.date, tags: [...tags] };
}

// Repères (commentaires Obsidian, invisibles en lecture) qui délimitent les commentaires dans une note
// créée d'après un gabarit : une nouvelle extraction n'écrit qu'entre eux.
export const START = "%% hypomnema:start %%";
export const END = "%% hypomnema:end %%";

/**
 * Note créée d'après un gabarit : {{comments}} reçoit les commentaires entre les repères (à défaut, ils
 * sont ajoutés en fin de note) et {{sources}} la liste des liens vers les notes sources. Les autres
 * variables du gabarit sont résolues avant l'appel.
 */
export function applyTemplate(template: string, sources: Source[], opts: ExtractOptions): string {
  const block = `${START}\n${renderBody(sources, opts).trimEnd()}\n${END}`;
  const links = sources.map((s) => `[[${s.path.replace(/\.md$/, "")}|${s.basename}]]`).join(", ");
  let text = template.replace(/\{\{sources\}\}/g, links);
  text = text.includes("{{comments}}") ? text.replace("{{comments}}", () => block).replace(/\{\{comments\}\}/g, "") : `${text.trimEnd()}\n\n${block}\n`;
  return text.endsWith("\n") ? text : text + "\n";
}

/**
 * Ajoute à une note d'extraction existante les seuls commentaires qu'elle ne contient pas encore,
 * chacun dans sa section. Le reste de la note (cartes déplacées, notes ajoutées à la main) est conservé.
 */
export function mergeNew(existing: string, sources: Source[], opts: ExtractOptions): { text: string; added: number } {
  // Note créée d'après un gabarit : seul l'intervalle entre les repères est concerné.
  const start = existing.indexOf(START);
  const end = existing.indexOf(END, start);
  if (start >= 0 && end > start) {
    const from = start + START.length;
    const inner = mergeInner(existing.slice(from, end), existing, sources, opts);
    const body = `\n${inner.text.replace(/^\n+/, "").trimEnd()}\n`;
    return { text: existing.slice(0, from) + body + existing.slice(end), added: inner.added };
  }
  return mergeInner(existing, existing, sources, opts);
}

/** `region` est la partie de la note où insérer ; `whole`, la note entière, sert à repérer les commentaires déjà présents. */
function mergeInner(region: string, whole: string, sources: Source[], opts: ExtractOptions): { text: string; added: number } {
  const existing = region;
  const fresh = sections(sources, opts)
    .map((s) => ({ heading: s.heading, items: s.items.filter((i) => !whole.includes(i.key)) }))
    .filter((s) => s.items.length);
  const added = fresh.reduce((n, s) => n + s.items.length, 0);
  if (!added) return { text: existing, added };

  const lines = existing.replace(/\r\n?/g, "\n").split("\n");
  if (opts.format === "table") {
    let last = -1;
    lines.forEach((l, i) => l.startsWith("|") && (last = i));
    const rows = fresh.flatMap((s) => s.items.map((i) => i.text));
    if (last < 0) return { text: `${existing.trimEnd()}\n\n${tableHeader(opts)}\n${rows.join("\n")}\n`, added };
    lines.splice(last + 1, 0, ...rows);
    return { text: lines.join("\n"), added };
  }

  for (const s of fresh) {
    const items = s.items.map((i) => i.text).join("\n").split("\n");
    const h = lines.findIndex((l) => l.trim() === `## ${s.heading}`);
    if (h >= 0) {
      // Fin de la section : prochain titre, réglages Kanban ou fin de note ; on insère après sa dernière ligne non vide.
      let end = h + 1;
      while (end < lines.length && !/^#{1,2} /.test(lines[end]) && !lines[end].startsWith("%% kanban:settings")) end++;
      let at = end;
      while (at > h + 1 && !lines[at - 1].trim()) at--;
      const before = at === h + 1 ? [""] : [];
      const after = lines[at]?.trim() ? [""] : [];
      lines.splice(at, 0, ...before, ...items, ...after);
    } else {
      // Section absente : avant les réglages Kanban s'il y en a, sinon en fin de note.
      let at = lines.findIndex((l) => l.startsWith("%% kanban:settings"));
      if (at < 0) at = lines.length;
      while (at > 0 && !lines[at - 1].trim()) at--;
      lines.splice(at, 0, "", `## ${s.heading}`, "", ...items);
    }
  }
  let text = lines.join("\n");
  if (!text.endsWith("\n")) text += "\n";
  return { text, added };
}
