import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import { parse } from "./syntax";
import { ComposeRequest, renderComposer, renderThread, ThreadHandlers } from "./ui";
import type Hypomnema from "./main";

export const PANEL_VIEW = "hypomnema-panel";

/** Liste des commentaires de la note active, dans l'ordre du texte ; on y lit, rédige, répond et navigue. */
export class CommentsPanel extends ItemView {
  private target: MarkdownView | null = null;
  private active: string | null = null;
  private editing: ComposeRequest | null = null;
  private draft: { text: string; tag?: string } = { text: "" };
  private focusComposer = false; // le focus ne va au compositeur qu'à son ouverture, pas à chaque rafraîchissement

  constructor(leaf: WorkspaceLeaf, private plugin: Hypomnema) {
    super(leaf);
  }

  getViewType() {
    return PANEL_VIEW;
  }
  getDisplayText() {
    return "Commentaires";
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
    this.abandonDraft();
  }

  /** Le panneau suit la dernière note Markdown active (cliquer dans le panneau ne la lui fait pas perdre). */
  setTarget(view: MarkdownView | null) {
    if (view && view !== this.target) {
      this.abandonDraft();
      this.target = view;
    }
    this.render();
  }

  /** Met en avant un fil (après un clic sur son passage dans la note) et le fait défiler jusqu'à lui. */
  focusThread(view: MarkdownView, id: string) {
    this.active = id;
    this.setTarget(view);
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
    this.draft = { text: entry?.text ?? "", tag: req.mode === "reply" ? undefined : t?.root.tag };
    this.focusComposer = true;
    this.render();
    this.scrollTo(this.active);
  }

  private scrollTo(id: string) {
    this.contentEl.querySelector<HTMLElement>(`[data-ma-thread="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  private abandonDraft() {
    if (this.editing && this.target) this.plugin.actions.cancel(this.target, this.editing);
    this.editing = null;
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
    el.empty();
    el.addClass("ma-panel");
    const view = this.target;
    if (!view || !view.file) {
      el.createDiv({ cls: "ma-empty", text: "Ouvrez une note pour voir ses commentaires." });
      return;
    }
    const editor = view.editor;
    const threads = parse(editor.getValue()).threads;
    el.createDiv({ cls: "ma-panel-title", text: view.file.basename });
    if (!threads.length) {
      el.createDiv({
        cls: "ma-empty",
        text: "Aucun commentaire. Placez le curseur ou sélectionnez un passage, puis clic droit → « Commenter », ou le raccourci que vous lui avez attribué.",
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

    const anchored = threads.filter((t) => t.anchor);
    const orphans = threads.filter((t) => !t.anchor);
    for (const t of anchored) {
      const item = el.createDiv({ cls: "ma-panel-item", attr: { "data-ma-thread": t.id } });
      const color = this.plugin.colorOf(t.root.tag);
      if (color) item.style.setProperty("--ma-color", color);
      item.toggleClass("is-active", t.id === this.active);
      renderThread(item, t, handlers, { quote: true, categories, composer, editing: this.editing });
      item.addEventListener("click", () => {
        this.active = t.id;
        el.querySelectorAll(".ma-panel-item").forEach((x) => x.toggleClass("is-active", x === item));
        this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
        this.plugin.actions.reveal(editor, t);
      });
    }
    if (orphans.length) {
      el.createDiv({
        cls: "ma-orphans-title",
        text: `⚠ ${orphans.length} commentaire(s) dont le passage a disparu (marqueurs supprimés)`,
      });
      for (const t of orphans) {
        const item = el.createDiv({ cls: "ma-panel-item is-orphan", attr: { "data-ma-thread": t.id } });
        renderThread(item, t, handlers, { quote: true, categories, composer, editing: this.editing });
      }
    }
    const toFocus = area as HTMLTextAreaElement | null;
    if (toFocus && this.focusComposer) {
      this.focusComposer = false;
      window.setTimeout(() => {
        toFocus.focus();
        toFocus.setSelectionRange(toFocus.value.length, toFocus.value.length);
      }, 0);
    }
  }
}
