import { Editor, MarkdownView, Notice, TFile } from "obsidian";
import type { EditorView } from "@codemirror/view";
import { addAnchor, addReply, AnnotationError, applyChanges, Change, deleteEntry, editEntry, parse, Thread } from "./syntax";
import { ComposeRequest, ConfirmModal } from "./ui";
import { flashEffect } from "./editorExtension";
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
      if (e instanceof AnnotationError) new Notice(e.message);
      else throw e;
    }
  }

  thread(view: MarkdownView, id: string): Thread | undefined {
    const root = id.split(".")[0];
    return parse(view.editor.getValue()).threads.find((t) => t.id === root);
  }

  /** Pose les marqueurs (sur la sélection, ou au curseur) et ouvre la rédaction dans le panneau. */
  startDraft(view: MarkdownView) {
    const editor = view.editor;
    const from = editor.posToOffset(editor.getCursor("from"));
    const to = editor.posToOffset(editor.getCursor("to"));
    const result = this.run(() => addAnchor(editor.getValue(), from, to));
    if (!result) return;
    this.apply(editor, result.changes);
    this.compose(view, { mode: "new", id: result.id });
  }

  async save(view: MarkdownView, req: ComposeRequest, text: string, tag?: string): Promise<boolean> {
    if (!text.trim()) {
      new Notice("Le commentaire est vide.");
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
    const msg = n
      ? `Supprimer ce commentaire et ses ${n} réponse(s) ? Le texte source est conservé.`
      : "Supprimer ce commentaire ? Le texte source est conservé.";
    new ConfirmModal(this.plugin.app, msg, () => void doIt()).open();
  }

  /**
   * Aligne les tags du frontmatter sur les catégories des commentaires de la note.
   * Ajoute les tags manquants ; ne retire que ceux que le plugin a lui-même ajoutés.
   */
  async syncTags(view: MarkdownView) {
    const file = view.file;
    if (!file) return;
    const used = new Set(
      parse(view.editor.getValue()).threads.filter((t) => t.root.date && t.root.tag).map((t) => t.root.tag!),
    );
    const settings = this.plugin.settings;
    const added = new Set(settings.addedTags[file.path] ?? []);
    const current = frontmatterTags(this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.tags);
    const toAdd = [...used].filter((t) => !current.includes(t));
    const toRemove = [...added].filter((t) => !used.has(t));
    if (!toAdd.length && !toRemove.length) return;

    // Enregistre d'abord la note, pour que la modification des propriétés parte du texte à jour.
    await view.save();
    await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
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

  /** Amène l'éditeur sur le passage commenté, le sélectionne et le met brièvement en évidence. */
  reveal(editor: Editor, t: Thread) {
    if (!t.anchor) return;
    const point = t.anchor.closeFrom === t.anchor.openTo;
    const fromOff = point ? t.anchor.openFrom : t.anchor.openTo;
    const toOff = point ? t.anchor.closeTo : t.anchor.closeFrom;
    const from = editor.offsetToPos(fromOff);
    const to = editor.offsetToPos(toOff);
    if (point) editor.setCursor(editor.offsetToPos(t.anchor.closeTo));
    else editor.setSelection(from, to);
    editor.scrollIntoView({ from, to }, true);
    const cm = (editor as unknown as { cm?: EditorView }).cm;
    if (cm) {
      cm.dispatch({ effects: flashEffect.of({ from: fromOff, to: toOff }) });
      window.setTimeout(() => cm.dispatch({ effects: flashEffect.of(null) }), 1500);
    }
  }
}
