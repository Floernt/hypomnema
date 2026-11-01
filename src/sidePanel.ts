import { ItemView, MarkdownView, Scope, WorkspaceLeaf } from "obsidian";
import { parse } from "./syntax";
import { ComposeRequest, renderComposer, renderThread, ThreadHandlers } from "./ui";
import type Hypomnema from "./main";
import { categoryClass } from "./settings";
import { t } from "./i18n";

export const PANEL_VIEW = "hypomnema-panel";

/** Liste des commentaires de la note active, dans l'ordre du texte ; on y lit, rédige, répond et navigue. */
export class CommentsPanel extends ItemView {
  private target: MarkdownView | null = null;
  private targetPath: string | null = null;
  private active: string | null = null;
  private editing: ComposeRequest | null = null;
  private draft: { text: string; tag?: string; cursor?: number } = { text: "" };
  private focusComposer = false; // le focus ne va au compositeur qu'à son ouverture, pas à chaque rafraîchissement
  // Obsidian capte Ctrl/Cmd+Entrée au niveau de la fenêtre, avant la zone de saisie : tant qu'elle a le focus,
  // ce raccourci passe par une portée clavier poussée en tête.
  private keys: Scope;
  private keysPushed = false;

  constructor(leaf: WorkspaceLeaf, private plugin: Hypomnema) {
    super(leaf);
    this.keys = new Scope(this.app.scope);
    this.keys.register(["Mod"], "Enter", () => {
      void this.saveDraft();
      return false;
    });
    this.contentEl.addEventListener("focusin", (e) => {
      if (e.target instanceof HTMLTextAreaElement) this.pushKeys();
    });
    this.contentEl.addEventListener("focusout", (e) => {
      if (!(e.relatedTarget instanceof HTMLTextAreaElement && this.contentEl.contains(e.relatedTarget))) this.popKeys();
    });
  }

  private pushKeys() {
    if (this.keysPushed) return;
    this.app.keymap.pushScope(this.keys);
    this.keysPushed = true;
  }

  private popKeys() {
    if (!this.keysPushed) return;
    this.app.keymap.popScope(this.keys);
    this.keysPushed = false;
  }

  getViewType() {
    return PANEL_VIEW;
  }
  getDisplayText() {
    return t("panelTitle");
  }
  getIcon() {
    return "message-square";
  }

  async onOpen() {
    // Un onglet de barre latérale n'est chargé qu'à son premier affichage : on reprend alors la note courante.
    const recent = this.app.workspace.getMostRecentLeaf()?.view;
    this.setTarget(recent instanceof MarkdownView ? recent : null);
  }

  async onClose() {
    this.popKeys();
    this.abandonDraft();
  }

  /** Ne se met à jour que si la vue ou la note suivie a changé (appelé à chaque changement de disposition). */
  follow(view: MarkdownView | null) {
    const v = view ?? this.target;
    if (v && (v !== this.target || v.file?.path !== this.targetPath)) this.setTarget(v);
  }

  /** Le panneau suit la dernière note Markdown active (cliquer dans le panneau ne la lui fait pas perdre). */
  setTarget(view: MarkdownView | null) {
    // Obsidian réutilise la même vue quand on ouvre une autre note dans l'onglet : on suit donc aussi le fichier.
    const path = view?.file?.path ?? null;
    if (view && (view !== this.target || path !== this.targetPath)) {
      this.abandonDraft();
      this.target = view;
      this.targetPath = path;
      this.active = null;
    }
    this.render();
  }

  /** Met en avant un fil (après un clic sur son passage dans la note) et le fait défiler jusqu'à lui. */
  focusThread(view: MarkdownView, id: string) {
    this.setTarget(view);
    this.active = id;
    this.render();
    this.scrollTo(id);
  }

  /** Ouvre la rédaction (nouveau commentaire, modification ou réponse) directement dans le panneau. */
  compose(view: MarkdownView, req: ComposeRequest) {
    this.setTarget(view);
    this.abandonDraft();
    const t = this.plugin.actions.thread(view, req.id);
    const entry = req.mode === "edit" ? (req.id.includes(".") ? t?.replies.find((r) => r.id === req.id) : t?.root) : undefined;
    this.editing = req;
    this.active = req.id.split(".")[0];
    this.draft = { text: entry?.text ?? req.text ?? "", tag: req.mode === "reply" ? undefined : (t?.root.tag ?? req.tag), cursor: req.cursor };
    this.focusComposer = true;
    this.render();
    this.scrollTo(this.active);
  }

  private scrollTo(id: string) {
    this.contentEl.querySelector<HTMLElement>(`[data-ma-thread="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /** Annule le brouillon en cours, dans la note où il a été ouvert (même si l'onglet affiche désormais une autre note). */
  private abandonDraft() {
    const req = this.editing;
    this.editing = null;
    if (!req || !this.target || !this.targetPath) return;
    if (this.target.file?.path === this.targetPath) this.plugin.actions.cancel(this.target, req);
    else void this.plugin.actions.cancelInFile(this.targetPath, req);
  }

  private async saveDraft() {
    const view = this.target;
    if (!view || !this.editing) return;
    const ok = await this.plugin.actions.save(view, this.editing, this.draft.text, this.draft.tag);
    if (!ok) return;
    this.editing = null;
    this.render();
    this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
  }

  private cancelDraft() {
    const view = this.target;
    this.abandonDraft();
    this.render();
    if (view) this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
  }

  render() {
    const el = this.contentEl;
    // Redessiner retire la zone de saisie sans événement « focusout » : on note si elle avait le focus pour le lui rendre.
    const typing = el.contains(el.doc.activeElement) && el.doc.activeElement instanceof HTMLTextAreaElement;
    el.empty();
    el.addClass("ma-panel");
    const view = this.target;
    if (!view || !view.file) {
      el.createDiv({ cls: "ma-empty", text: t("panelNoNote") });
      return;
    }
    const editor = view.editor;
    const threads = parse(editor.getValue()).threads;
    el.createDiv({ cls: "ma-panel-title", text: view.file.basename });
    if (!threads.length) {
      el.createDiv({
        cls: "ma-empty",
        text: t("panelEmpty"),
      });
      return;
    }

    const categories = this.plugin.settings.categories;
    const handlers: ThreadHandlers = {
      onReply: (id) => this.compose(view, { mode: "reply", id }),
      onEdit: (id) => this.compose(view, { mode: "edit", id }),
      onDelete: (id) => this.plugin.actions.delete(view, id),
    };
    let area: HTMLTextAreaElement | null = null;
    const composer = (parent: HTMLElement, withCategory: boolean) => {
      area = renderComposer(parent, {
        request: this.editing!,
        categories,
        withCategory,
        draft: this.draft,
        onSave: () => void this.saveDraft(),
        onCancel: () => this.cancelDraft(),
      });
    };

    const anchored = threads.filter((th) => th.anchor);
    const orphans = threads.filter((th) => !th.anchor);
    for (const th of anchored) {
      const item = el.createDiv({ cls: "ma-panel-item", attr: { "data-ma-thread": th.id } });
      const cls = categoryClass(categories, th.root.tag);
      if (cls) item.addClass(cls);
      item.toggleClass("is-active", th.id === this.active);
      renderThread(item, th, handlers, { quote: true, categories, composer, editing: this.editing });
      item.addEventListener("click", () => {
        this.active = th.id;
        el.querySelectorAll(".ma-panel-item").forEach((x) => x.toggleClass("is-active", x === item));
        this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
        this.plugin.actions.reveal(view, th);
      });
    }
    if (orphans.length) {
      el.createDiv({
        cls: "ma-orphans-title",
        text: t("orphans", { n: orphans.length }),
      });
      for (const th of orphans) {
        const item = el.createDiv({ cls: "ma-panel-item is-orphan", attr: { "data-ma-thread": th.id } });
        renderThread(item, th, handlers, { quote: true, categories, composer, editing: this.editing });
      }
    }
    const toFocus = area as HTMLTextAreaElement | null;
    if (toFocus && (this.focusComposer || typing)) {
      this.focusComposer = false;
      window.setTimeout(() => {
        toFocus.focus();
        const at = Math.min(this.draft.cursor ?? toFocus.value.length, toFocus.value.length);
        toFocus.setSelectionRange(at, at);
      }, 0);
    } else if (!toFocus) {
      this.popKeys();
    }
  }
}
