import { App, Modal, setIcon } from "obsidian";
import type { Entry, Thread } from "./syntax";
import { categoryClass, Category } from "./settings";
import { t } from "./i18n";

export interface ThreadHandlers {
  onReply(rootId: string): void;
  onEdit(id: string): void;
  onDelete(id: string): void;
}

/** Ce que le panneau est en train de rédiger : un nouveau commentaire, une modification ou une réponse. */
export interface ComposeRequest {
  mode: "new" | "edit" | "reply";
  id: string; // fil (new, reply) ou entrée (edit)
  /** Préremplissage d'un nouveau commentaire (geste d'annotation) : texte, catégorie, position du curseur. */
  text?: string;
  tag?: string;
  cursor?: number;
}

export interface ComposerOptions {
  request: ComposeRequest;
  categories: Category[];
  withCategory: boolean; // racines uniquement
  draft: { text: string; tag?: string; cursor?: number };
  onSave(): void;
  onCancel(): void;
}

const QUOTE_MAX = 160;

export function truncate(s: string, max = QUOTE_MAX): string {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

function iconButton(parent: HTMLElement, icon: string, label: string, onClick: () => void) {
  const b = parent.createEl("button", { cls: "ma-btn clickable-icon", attr: { "aria-label": label } });
  setIcon(b, icon);
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
}

function renderEntry(parent: HTMLElement, e: Entry, isReply: boolean, h: ThreadHandlers, categories: Category[]) {
  const el = parent.createDiv({ cls: isReply ? "ma-entry ma-reply" : "ma-entry" });
  const head = el.createDiv({ cls: "ma-entry-head" });
  const meta = head.createDiv({ cls: "ma-meta" });
  meta.createSpan({ cls: "ma-date", text: e.date || t("noComment") });
  if (e.tag) {
    const cat = categories.find((c) => c.tag === e.tag);
    meta.createSpan({ cls: "ma-tag", text: cat?.name || `#${e.tag}` });
  }
  const actions = head.createDiv({ cls: "ma-actions" });
  iconButton(actions, "pencil", t("edit"), () => h.onEdit(e.id));
  iconButton(actions, "trash-2", isReply ? t("deleteReply") : t("deleteThread"), () => h.onDelete(e.id));
  if (e.text) el.createDiv({ cls: "ma-text", text: e.text });
}

/** Zone de saisie dans le panneau : catégorie (racines), texte, Ctrl/Cmd+Entrée pour enregistrer, Échap pour annuler. */
export function renderComposer(parent: HTMLElement, o: ComposerOptions): HTMLTextAreaElement {
  const el = parent.createDiv({ cls: o.request.mode === "reply" ? "ma-composer ma-reply" : "ma-composer" });
  el.addEventListener("click", (e) => e.stopPropagation());

  if (o.withCategory) {
    const chips = el.createDiv({ cls: "ma-chips" });
    const options: { label: string; tag?: string }[] = [
      { label: t("none") },
      ...o.categories.filter((c) => c.tag).map((c) => ({ label: c.name || `#${c.tag}`, tag: c.tag })),
    ];
    if (o.draft.tag && !o.categories.some((c) => c.tag === o.draft.tag)) options.push({ label: `#${o.draft.tag}`, tag: o.draft.tag });
    for (const opt of options) {
      const chip = chips.createEl("button", { cls: "ma-chip", text: opt.label });
      const cls = categoryClass(o.categories, opt.tag);
      if (cls) chip.addClass(cls);
      chip.toggleClass("is-selected", opt.tag === o.draft.tag);
      chip.addEventListener("click", () => {
        o.draft.tag = opt.tag;
        chips.querySelectorAll(".ma-chip").forEach((c) => c.toggleClass("is-selected", c === chip));
        area.focus();
      });
    }
  }

  const area = el.createEl("textarea", {
    cls: "ma-textarea",
    attr: { placeholder: o.request.mode === "reply" ? t("placeholderReply") : t("placeholderComment"), rows: "4" },
  });
  area.value = o.draft.text;
  // Le panneau se redessine pendant la rédaction : la position du curseur est gardée avec le brouillon.
  if (o.draft.cursor !== undefined) area.setSelectionRange(o.draft.cursor, o.draft.cursor);
  const keep = () => (o.draft.cursor = area.selectionStart);
  area.addEventListener("input", () => {
    o.draft.text = area.value;
    keep();
  });
  area.addEventListener("keyup", keep);
  area.addEventListener("mouseup", keep);
  area.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      o.onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      o.onCancel();
    }
  });

  const bar = el.createDiv({ cls: "ma-composer-bar" });
  bar.createEl("button", { text: t("cancel") }).addEventListener("click", () => o.onCancel());
  bar.createEl("button", { cls: "mod-cta", text: t("save") }).addEventListener("click", () => o.onSave());
  return area;
}

export interface RenderThreadOptions {
  quote?: boolean;
  categories: Category[];
  /** Fournit le compositeur quand ce fil est en cours de rédaction. */
  composer?: (parent: HTMLElement, withCategory: boolean) => void;
  editing?: ComposeRequest | null;
}

/** Affiche un fil (commentaire + réponses), avec le compositeur à la place de l'entrée en cours d'édition. */
export function renderThread(parent: HTMLElement, th: Thread, h: ThreadHandlers, o: RenderThreadOptions) {
  if (o.quote) {
    parent.createEl("blockquote", {
      cls: "ma-quote",
      text: th.anchor ? truncate(th.quote) || t("point") : t("passageMissing"),
    });
  }
  const ed = o.editing;
  const editingRoot = ed && ((ed.mode === "new" && ed.id === th.id) || (ed.mode === "edit" && ed.id === th.id));
  if (editingRoot && o.composer) o.composer(parent, true);
  else renderEntry(parent, th.root, false, h, o.categories);

  for (const r of th.replies) {
    if (ed?.mode === "edit" && ed.id === r.id && o.composer) o.composer(parent, false);
    else renderEntry(parent, r, true, h, o.categories);
  }

  if (ed?.mode === "reply" && ed.id === th.id && o.composer) {
    o.composer(parent, false);
  } else if (!editingRoot) {
    const reply = parent.createEl("button", { cls: "ma-reply-btn", text: t("reply") });
    reply.addEventListener("click", (e) => {
      e.stopPropagation();
      h.onReply(th.id);
    });
  }
}

/** Confirmation ; par défaut, celle d'une suppression. */
export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private onConfirm: () => void,
    private labels: { title?: string; button?: string; cta?: boolean } = {},
    private onDismiss: () => void = () => {},
  ) {
    super(app);
  }

  private confirmed = false;

  onOpen() {
    this.titleEl.setText(this.labels.title ?? t("confirmTitle"));
    this.contentEl.createEl("p", { text: this.message });
    const bar = this.contentEl.createDiv({ cls: "modal-button-container" });
    bar.createEl("button", { text: t("cancel") }).addEventListener("click", () => this.close());
    const cls = this.labels.cta ? "mod-cta" : "mod-warning";
    bar.createEl("button", { cls, text: this.labels.button ?? t("delete") }).addEventListener("click", () => {
      this.confirmed = true;
      this.close();
      this.onConfirm();
    });
  }

  onClose() {
    this.contentEl.empty();
    if (!this.confirmed) this.onDismiss();
  }
}
