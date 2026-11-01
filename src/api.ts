// API publique : app.plugins.plugins.hypomnema.api, pour les scripts (hypomnema, QuickAdd, Templater, dataviewjs).
// Les écritures passent par les mêmes fonctions que l'interface : tags synchronisés, événements émis.

import { normalizePath, TFile, TFolder } from "obsidian";
import { today } from "./actions";
import { format, resolveSince } from "./format";
import { filterSources } from "./gestes";
import { addComment, addReply, applyChanges, parse, Thread } from "./syntax";
import type Hypomnema from "./main";

export class HypomnemaApi {
  readonly version = "1";

  constructor(private plugin: Hypomnema) {}

  private get vault() {
    return this.plugin.app.vault;
  }

  /** Fils de commentaires d'une note, dans l'ordre du texte (les orphelins à la fin). */
  async threads(file: TFile): Promise<Thread[]> {
    return parse(await this.vault.cachedRead(file)).threads.filter((th) => th.root.date);
  }

  /**
   * Tous les fils du coffre, ou d'un dossier. `categories` : tags retenus (vide : tous) ;
   * `since` : date AAAA-MM-JJ ou {{date-7d}}, comparée à la dernière activité du fil.
   */
  async allThreads(opts: { folder?: string; categories?: string[]; since?: string } = {}): Promise<{ file: TFile; thread: Thread }[]> {
    const folder = opts.folder ? this.vault.getAbstractFileByPath(normalizePath(opts.folder)) : this.vault.getRoot();
    if (!(folder instanceof TFolder)) throw new Error(`Folder not found: ${opts.folder}`);
    const sources = filterSources(await this.plugin.actions.sourcesIn(folder), {
      categories: opts.categories ?? [],
      since: resolveSince(opts.since, today()),
    });
    const out: { file: TFile; thread: Thread }[] = [];
    for (const s of sources) {
      const file = this.vault.getAbstractFileByPath(s.path);
      if (!(file instanceof TFile)) continue;
      for (const thread of s.parsed.threads) if (thread.root.date) out.push({ file, thread });
    }
    return out;
  }

  /**
   * Ajoute un commentaire. `{ quote }` : le passage à commenter, qui doit apparaître une seule fois dans la
   * note, ou dont `occurrence` (à partir de 1) désigne l'apparition voulue. `{ line }` : commentaire au point,
   * en fin de ligne (numérotée à partir de 0, comme dans l'éditeur d'Obsidian). Renvoie l'identifiant (aN).
   */
  async addComment(file: TFile, target: { quote: string; occurrence?: number } | { line: number }, text: string, tag?: string): Promise<string> {
    let id = "";
    let doc = "";
    await this.vault.process(file, (current) => {
      const [from, to] = locate(current, target);
      const r = addComment(current, from, to, text, today(), tag?.replace(/^#/, ""));
      id = r.id;
      doc = applyChanges(current, r.changes);
      return doc;
    });
    this.plugin.actions.trigger("comment-added", { file, id, text, tag });
    await this.plugin.actions.syncTagsFile(file, doc);
    return id;
  }

  /** Répond au fil `id` (aN). */
  async reply(file: TFile, id: string, text: string): Promise<void> {
    let replyId = id;
    await this.vault.process(file, (current) => {
      const doc = applyChanges(current, addReply(current, id, text, today()));
      const th = parse(doc).threads.find((x) => x.id === id);
      replyId = th?.replies[th.replies.length - 1]?.id ?? id;
      return doc;
    });
    this.plugin.actions.trigger("comment-added", { file, id: replyId, text });
  }

  /** Lance une action ; `vars` répond à ses {{VALUE:…}}. */
  async runAction(id: string, vars: Record<string, string> = {}): Promise<void> {
    await this.plugin.runner.run(id, { values: vars });
  }

  /** Applique la syntaxe des variables, avec les variables globales et la date du jour. */
  format(template: string, vars: Record<string, string> = {}): string {
    return format(template, {
      vars,
      today: today(),
      globals: this.plugin.actions.globals(),
      values: vars,
      formatDate: this.plugin.actions.formatDate,
    });
  }
}

/** Fin des propriétés (frontmatter) ; 0 si la note n'en a pas. Aucun commentaire ne peut s'y loger. */
function frontmatterEnd(doc: string): number {
  const m = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/.exec(doc);
  return m ? m[0].length : 0;
}

function locate(doc: string, target: { quote: string; occurrence?: number } | { line: number }): [number, number] {
  const [from, to] = locateRaw(doc, target);
  if (from < frontmatterEnd(doc)) throw new Error("This position is inside the note's properties.");
  return [from, to];
}

function locateRaw(doc: string, target: { quote: string; occurrence?: number } | { line: number }): [number, number] {
  if ("line" in target) {
    const lines = doc.split("\n");
    if (target.line < 0 || target.line >= lines.length) throw new Error(`Line ${target.line} out of range.`);
    const end = lines.slice(0, target.line + 1).join("\n").length;
    return [end, end];
  }
  const hits: number[] = [];
  for (let i = doc.indexOf(target.quote); target.quote && i >= 0; i = doc.indexOf(target.quote, i + 1)) hits.push(i);
  if (!hits.length) throw new Error(`Passage not found: “${target.quote}”.`);
  if (target.occurrence === undefined && hits.length > 1) {
    throw new Error(`Passage found ${hits.length} times: “${target.quote}”. Pass { occurrence } to choose one.`);
  }
  const at = hits[(target.occurrence ?? 1) - 1];
  if (at === undefined) throw new Error(`Occurrence ${target.occurrence} not found (${hits.length} in the note).`);
  return [at, at + target.quote.length];
}
