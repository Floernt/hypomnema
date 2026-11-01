import { Editor, MarkdownView, moment, normalizePath, Notice, TFile, TFolder } from "obsidian";
import { addAnchor, addReply, AnnotationError, applyChanges, Change, deleteEntry, editEntry, parse, Thread } from "./syntax";
import { applyTemplate, countComments, ExtractOptions, extractionProperties, mergeNew, renderExtraction, Source } from "./extract";
import { format, FormatEnv, resolveSince } from "./format";
import { ExtractionFields, filterSources } from "./gestes";
import { runTemplater } from "./integrations";
import { ComposeRequest, ConfirmModal } from "./ui";
import { editorViewOf, flashEffect } from "./editorExtension";
import { t } from "./i18n";
import type Hypomnema from "./main";

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function frontmatterTags(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\s]+/) : [];
  return list.map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean);
}

/** Appel de moment, dont les définitions exportées par Obsidian ne décrivent pas la signature. */
type MomentFn = (input: string, format: string) => { format(f: string): string };

type ExtractionTarget =
  | { kind: "note"; file: TFile; name: string; sourceFolder: string }
  | { kind: "folder"; folder: TFolder; name: string; sourceFolder: string };

/** Les opérations sur les commentaires d'une note (annulables par Ctrl+Z), et la synchronisation des tags. */
export class Actions {
  /** Ouvre le compositeur du panneau ; branché par le plugin. */
  compose: (view: MarkdownView, req: ComposeRequest) => void = () => {};

  constructor(private plugin: Hypomnema) {}

  private apply(editor: Editor, changes: Change[]) {
    if (!changes.length) return;
    editor.transaction({
      changes: changes.map((c) => ({ from: editor.offsetToPos(c.from), to: editor.offsetToPos(c.to), text: c.insert })),
    });
  }

  private run<T>(fn: () => T): T | undefined {
    try {
      return fn();
    } catch (e) {
      if (e instanceof AnnotationError) new Notice(t(`error.${e.code}`));
      else throw e;
    }
  }

  thread(view: MarkdownView, id: string): Thread | undefined {
    const root = id.split(".")[0];
    return parse(view.editor.getValue()).threads.find((t) => t.id === root);
  }

  /**
   * Pose les marqueurs (sur la sélection, ou au curseur) et ouvre la rédaction dans le panneau,
   * éventuellement préremplie par un geste d'annotation.
   */
  startDraft(view: MarkdownView, preset: { text?: string; tag?: string; cursor?: number } = {}) {
    const editor = view.editor;
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));
    const result = this.run(() => addAnchor(editor.getValue(), from, to));
    if (!result) return;
    this.apply(editor, result.changes);
    this.compose(view, { mode: "new", id: result.id, ...preset });
  }

  /** Événements auxquels un script ou un autre plugin peut s'abonner : app.workspace.on("hypomnema:…", …). */
  trigger(name: "comment-added" | "comment-edited" | "extracted", data: Record<string, unknown>) {
    this.plugin.app.workspace.trigger(`hypomnema:${name}`, data);
  }

  async save(view: MarkdownView, req: ComposeRequest, text: string, tag?: string): Promise<boolean> {
    if (!text.trim()) {
      new Notice(t("emptyComment"));
      return false;
    }
    const editor = view.editor;
    const doc = editor.getValue();
    const changes = this.run(() => {
      if (req.mode === "reply") return addReply(doc, req.id, text, today());
      return editEntry(doc, req.id, text, today(), req.id.includes(".") ? undefined : tag);
    });
    if (!changes) return false;
    this.apply(editor, changes);
    if (view.file) {
      const th = this.thread(view, req.id);
      const id = req.mode === "reply" ? (th?.replies[th.replies.length - 1]?.id ?? req.id) : req.id;
      this.trigger(req.mode === "edit" ? "comment-edited" : "comment-added", { file: view.file, id, text, tag });
    }
    await this.syncTags(view);
    return true;
  }

  /** Abandon d'une rédaction : un nouveau commentaire jamais enregistré perd ses marqueurs. */
  cancel(view: MarkdownView, req: ComposeRequest) {
    if (req.mode !== "new") return;
    const t = this.thread(view, req.id);
    if (t && !t.root.date && !t.replies.length) {
      this.run(() => this.apply(view.editor, deleteEntry(view.editor.getValue(), req.id)));
    }
  }

  /** Même chose que `cancel`, pour une note qui n'est plus affichée dans l'éditeur. */
  async cancelInFile(path: string, req: ComposeRequest) {
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    if (req.mode !== "new" || !(file instanceof TFile)) return;
    await this.plugin.app.vault.process(file, (doc) => {
      const t = parse(doc).threads.find((x) => x.id === req.id);
      if (!t || t.root.date || t.replies.length) return doc;
      return applyChanges(doc, deleteEntry(doc, req.id));
    });
  }

  delete(view: MarkdownView, id: string) {
    const doIt = async () => {
      this.run(() => this.apply(view.editor, deleteEntry(view.editor.getValue(), id)));
      await this.syncTags(view);
    };
    if (id.includes(".")) return void doIt();
    const n = this.thread(view, id)?.replies.length ?? 0;
    const msg = n ? t("confirmDeleteWithReplies", { n }) : t("confirmDelete");
    new ConfirmModal(this.plugin.app, msg, () => void doIt()).open();
  }

  /**
   * Aligne les tags du frontmatter sur les catégories des commentaires de la note.
   * Ajoute les tags manquants ; ne retire que ceux que le plugin a lui-même ajoutés.
   */
  async syncTags(view: MarkdownView) {
    if (!view.file) return;
    // Enregistre d'abord la note, pour que la modification des propriétés parte du texte à jour.
    await view.save();
    await this.syncTagsFile(view.file, view.editor.getValue());
  }

  /** Même chose pour une note lue sur le disque (écriture par l'API). */
  async syncTagsFile(file: TFile, doc: string) {
    const used = new Set(parse(doc).threads.filter((t) => t.root.date && t.root.tag).map((t) => t.root.tag!));
    const settings = this.plugin.settings;
    const added = new Set(settings.addedTags[file.path] ?? []);
    const current = frontmatterTags(this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.tags);
    const toAdd = [...used].filter((t) => !current.includes(t));
    const toRemove = [...added].filter((t) => !used.has(t));
    if (!toAdd.length && !toRemove.length) return;
    await this.plugin.app.fileManager.processFrontMatter(file, (fm: { tags?: unknown }) => {
      const tags = frontmatterTags(fm.tags).filter((t) => !toRemove.includes(t));
      for (const t of toAdd) {
        if (tags.includes(t)) continue; // déjà posé à la main : le plugin ne s'en attribue pas la paternité
        tags.push(t);
        added.add(t);
      }
      if (tags.length) fm.tags = tags;
      else delete fm.tags;
    });
    for (const t of toRemove) added.delete(t);
    if (added.size) settings.addedTags[file.path] = [...added];
    else delete settings.addedTags[file.path];
    await this.plugin.saveSettings();
  }

  /** Suivi des renommages et suppressions de notes pour la liste des tags ajoutés par le plugin. */
  async onRename(file: TFile, oldPath: string) {
    const map = this.plugin.settings.addedTags;
    if (!map[oldPath]) return;
    map[file.path] = map[oldPath];
    delete map[oldPath];
    await this.plugin.saveSettings();
  }

  /** Extraction par défaut d'une note (commande « Extraire les commentaires de cette note »). */
  async extractNote(file: TFile) {
    await this.extractWith({ ...this.defaultExtraction(), scope: "note" }, { file });
  }

  /** Extraction par défaut d'un dossier, sous-dossiers compris (menu des dossiers). */
  async extractFolder(folder: TFolder) {
    await this.extractWith(this.defaultExtraction(), { folder });
  }

  defaultExtraction(): ExtractionFields {
    return { ...this.plugin.settings.extract, scope: "context", folderPath: "", folderMenu: true };
  }

  globals(): Record<string, string> {
    return Object.fromEntries(this.plugin.settings.globals.filter((g) => g.name.trim()).map((g) => [g.name.trim(), g.value]));
  }

  /** Mise en forme des dates {{date:FORMAT}} par moment, comme le reste d'Obsidian. */
  formatDate = (iso: string, f: string) => (moment as unknown as MomentFn)(iso, "YYYY-MM-DD").format(f);

  /**
   * Extraction selon des réglages donnés. `ctx` précise d'où elle est lancée : une note (commande) ou un
   * dossier (menu des dossiers, qui l'emporte alors sur la portée). `run.values` contient les réponses aux
   * {{VALUE:…}}, `run.templateText` le contenu de la note-gabarit, déjà lu.
   */
  async extractWith(
    fields: ExtractionFields,
    ctx: { file?: TFile | null; folder?: TFolder } = {},
    run: { values?: Record<string, string>; templateText?: string } = {},
  ): Promise<TFile | null> {
    const target = this.extractionTarget(fields, ctx);
    if (!target) return null;
    const all = target.kind === "note" ? [await this.source(target.file)] : await this.sourcesIn(target.folder);
    const date = today();
    const sources = filterSources(all, { categories: fields.categories, since: resolveSince(fields.since, date) });
    const count = countComments(sources);
    if (!count) {
      new Notice(t("extractNone"));
      return null;
    }
    const opts: ExtractOptions = {
      format: fields.format,
      lineTemplate: fields.lineTemplate,
      includeReplies: fields.includeReplies,
      categories: this.plugin.settings.categories,
      date,
      vault: this.plugin.app.vault.getName(),
      globals: this.globals(),
      values: run.values,
      formatDate: this.formatDate,
      labels: {
        uncategorized: t("extractUncategorized"),
        done: t("extractDone"),
        columns: [t("colNote"), t("colCategory"), t("colDate"), t("colPassage"), t("colComment"), t("colLink")],
      },
    };
    const env: FormatEnv = { vars: { note: target.name }, today: date, globals: opts.globals, values: run.values, formatDate: this.formatDate };
    const vault = this.plugin.app.vault;
    const folderSetting = format(fields.folder, env).trim();
    const folder = folderSetting ? normalizePath(folderSetting) : target.sourceFolder;
    // Le nom de fichier ne peut contenir ni barre oblique ni caractères réservés.
    const base = format(fields.fileName, env).replace(/[\\/:*?"<>|#^[\]]/g, "-").trim() || target.name;
    const path = normalizePath(`${folder && folder !== "/" ? folder + "/" : ""}${base}.md`);
    if (folder && folder !== "/" && !vault.getAbstractFileByPath(folder)) await vault.createFolder(folder);

    // Le gabarit ne vaut pas pour le format Kanban, dont la structure est imposée par le plugin Kanban.
    const template = run.templateText !== undefined && fields.format !== "kanban" ? format(run.templateText, env) : undefined;
    const fresh = () => (template !== undefined ? applyTemplate(template, sources, opts) : renderExtraction(sources, opts));

    const existing = vault.getAbstractFileByPath(path);
    let file: TFile;
    let added = count;
    let created = true;
    if (existing instanceof TFile && fields.onExisting === "append-new") {
      file = existing;
      created = false;
      await vault.process(file, (text) => {
        const r = mergeNew(text, sources, opts);
        added = r.added;
        return r.text;
      });
    } else {
      if (existing instanceof TFile) await vault.modify(existing, fresh());
      file = existing instanceof TFile ? existing : await vault.create(path, fresh());
      if (template !== undefined) await this.addProperties(file, sources, opts);
      // Attendre que ses propriétés soient indexées : le plugin Kanban s'appuie dessus pour l'ouvrir en tableau.
      await this.indexed(file);
    }
    if (created && fields.templater) await runTemplater(this.plugin.app, file);
    new Notice(added ? t("extractDoneNotice", { n: added, file: file.basename }) : t("extractNothingNew", { file: file.basename }));
    this.trigger("extracted", { file, added, sources: sources.map((s) => s.path) });
    await this.plugin.app.workspace.getLeaf("tab").openFile(file);
    return file;
  }

  /** Ce que couvre une extraction : une note, ou un dossier (le coffre entier étant le dossier racine). */
  private extractionTarget(fields: ExtractionFields, ctx: { file?: TFile | null; folder?: TFolder }): ExtractionTarget | null {
    const vault = this.plugin.app.vault;
    const asFolder = (folder: TFolder): ExtractionTarget => ({
      kind: "folder",
      folder,
      name: folder.isRoot() ? vault.getName() : folder.name,
      sourceFolder: folder.isRoot() ? "" : folder.path,
    });
    if (ctx.folder) return asFolder(ctx.folder);
    if (fields.scope === "vault") return asFolder(vault.getRoot());
    if (fields.scope === "folder") {
      const folder = vault.getAbstractFileByPath(normalizePath(fields.folderPath || "/"));
      if (folder instanceof TFolder) return asFolder(folder);
      new Notice(t("folderMissing", { path: fields.folderPath }));
      return null;
    }
    const file = ctx.file ?? this.plugin.app.workspace.getActiveFile();
    if (!file || file.extension !== "md") {
      new Notice(t("gesteNeedsNote"));
      return null;
    }
    if (fields.scope === "folder-current") return asFolder(file.parent ?? vault.getRoot());
    return { kind: "note", file, name: file.basename, sourceFolder: file.parent && !file.parent.isRoot() ? file.parent.path : "" };
  }

  private async source(file: TFile): Promise<Source> {
    return { path: file.path, basename: file.basename, parsed: parse(await this.plugin.app.vault.cachedRead(file)) };
  }

  /** Notes commentées d'un dossier, sous-dossiers compris. */
  async sourcesIn(folder: TFolder): Promise<Source[]> {
    const vault = this.plugin.app.vault;
    const prefix = folder.isRoot() ? "" : folder.path + "/";
    const files = vault.getMarkdownFiles().filter((f) => f.path.startsWith(prefix)).sort((a, b) => a.path.localeCompare(b.path));
    const sources: Source[] = [];
    for (const f of files) {
      const doc = await vault.cachedRead(f);
      if (!doc.includes("%% annotations")) continue;
      const parsed = parse(doc);
      // Une note d'extraction précédente cite des commentaires, elle n'en contient pas.
      if (parsed.threads.length) sources.push({ path: f.path, basename: f.basename, parsed });
    }
    return sources;
  }

  /** Note créée d'après un gabarit : ses propriétés sont gardées, celles d'hypomnema s'y ajoutent. */
  private async addProperties(file: TFile, sources: Source[], opts: ExtractOptions) {
    const p = extractionProperties(sources, opts);
    await this.plugin.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
      fm["hypomnema-extract"] = true;
      fm["hypomnema-source"] = p.source;
      fm["hypomnema-date"] = p.date;
      const tags = frontmatterTags(fm.tags);
      for (const tag of p.tags) if (!tags.includes(tag)) tags.push(tag);
      if (tags.length) fm.tags = tags;
    });
  }

  private indexed(file: TFile): Promise<void> {
    const cache = this.plugin.app.metadataCache;
    if (cache.getFileCache(file)?.frontmatter) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        cache.offref(ref);
        window.clearTimeout(timer);
        resolve();
      };
      const ref = cache.on("changed", (f) => f === file && done());
      const timer = window.setTimeout(done, 2000);
    });
  }

  /**
   * Lien obsidian://hypomnema?file=…&id=aN d'une note d'extraction : ouvre la note et amène au passage.
   * Avec run=<id>, lance cette action ; les autres paramètres répondent aux {{VALUE:…}} de même nom.
   * « action » est réservé par Obsidian (nom du gestionnaire), d'où « run ».
   */
  async openLink(params: Record<string, string>) {
    const id = params.run;
    if (id) {
      const values = { ...params };
      for (const k of ["action", "vault", "run"]) delete values[k];
      await this.plugin.runner.run(id, { values });
      return;
    }
    const file = this.plugin.app.vault.getAbstractFileByPath(params.file ?? "");
    if (!(file instanceof TFile)) return;
    const leaf = this.plugin.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    const view = leaf.view;
    if (!(view instanceof MarkdownView) || !params.id) return;
    const th = this.thread(view, params.id);
    if (th) this.reveal(view, th);
  }

  /** Amène l'éditeur sur le passage commenté, le sélectionne et le met brièvement en évidence. */
  reveal(view: MarkdownView, th: Thread) {
    if (!th.anchor) return;
    const editor = view.editor;
    const point = th.anchor.closeFrom === th.anchor.openTo;
    const fromOff = point ? th.anchor.openFrom : th.anchor.openTo;
    const toOff = point ? th.anchor.closeTo : th.anchor.closeFrom;
    const from = editor.offsetToPos(fromOff);
    const to = editor.offsetToPos(toOff);
    if (point) editor.setCursor(editor.offsetToPos(th.anchor.closeTo));
    else editor.setSelection(from, to);
    editor.scrollIntoView({ from, to }, true);
    const cm = editorViewOf(view);
    if (cm) {
      cm.dispatch({ effects: flashEffect.of({ from: fromOff, to: toOff }) });
      window.setTimeout(() => cm.dispatch({ effects: flashEffect.of(null) }), 1500);
    }
  }
}
