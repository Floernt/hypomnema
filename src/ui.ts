import { App, Modal, setIcon } from "obsidian";
import type { Entry, Thread } from "./syntax";
import type { Category } from "./settings";

export interface ThreadHandlers {
  onReply(rootId: string): void;
  onEdit(id: string): void;
  onDelete(id: string): void;
}

/** Ce que le panneau est en train de rédiger : un nouveau commentaire, une modification ou une réponse. */
export interface ComposeRequest {
  mode: "new" | "edit" | "reply";
  id: string; // fil (new, reply) ou entrée (edit)
}

export interface ComposerOptions {
  request: ComposeRequest;
  categories: Category[];
  withCategory: boolean; // racines uniquement
  draft: { text: string; tag?: string };
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
  meta.createSpan({ cls: "ma-date", text: e.date || "sans commentaire" });
  if (e.tag) {
    const cat = categories.find((c) => c.tag === e.tag);
    meta.createSpan({ cls: "ma-tag", text: cat?.name || `#${e.tag}` });
  }
  const actions = head.createDiv({ cls: "ma-actions" });
  iconButton(actions, "pencil", "Modifier", () => h.onEdit(e.id));
  iconButton(actions, "trash-2", isReply ? "Supprimer la réponse" : "Supprimer le fil", () => h.onDelete(e.id));
  if (e.text) el.createDiv({ cls: "ma-text", text: e.text });
}

/** Zone de saisie dans le panneau : catégorie (racines), texte, Ctrl/Cmd+Entrée pour enregistrer, Échap pour annuler. */
export function renderComposer(parent: HTMLElement, o: ComposerOptions): HTMLTextAreaElement {
  const el = parent.createDiv({ cls: o.request.mode === "reply" ? "ma-composer ma-reply" : "ma-composer" });
  el.addEventListener("click", (e) => e.stopPropagation());

  if (o.withCategory) {
    const chips = el.createDiv({ cls: "ma-chips" });
    const options: { label: string; tag?: string; color?: string }[] = [
      { label: "Aucune" },
      ...o.categories.filter((c) => c.tag).map((c) => ({ label: c.name || `#${c.tag}`, tag: c.tag, color: c.color })),
    ];
    if (o.draft.tag && !o.categories.some((c) => c.tag === o.draft.tag)) options.push({ label: `#${o.draft.tag}`, tag: o.draft.tag });
    for (const opt of options) {
      const chip = chips.createEl("button", { cls: "ma-chip", text: opt.label });
      if (opt.color) chip.style.setProperty("--ma-color", opt.color);
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
    attr: { placeholder: o.request.mode === "reply" ? "Votre réponse…" : "Votre commentaire…", rows: "4" },
  });
  area.value = o.draft.text;
  area.addEventListener("input", () => (o.draft.text = area.value));
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
  bar.createEl("button", { text: "Annuler" }).addEventListener("click", () => o.onCancel());
  bar.createEl("button", { cls: "mod-cta", text: "Enregistrer" }).addEventListener("click", () => o.onSave());
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
export function renderThread(parent: HTMLElement, t: Thread, h: ThreadHandlers, o: RenderThreadOptions) {
  if (o.quote) {
    parent.createEl("blockquote", {
      cls: "ma-quote",
      text: t.anchor ? truncate(t.quote) || "(point)" : "Passage introuvable (marqueurs supprimés)",
    });
  }
  const ed = o.editing;
  const editingRoot = ed && ((ed.mode === "new" && ed.id === t.id) || (ed.mode === "edit" && ed.id === t.id));
  if (editingRoot && o.composer) o.composer(parent, true);
  else renderEntry(parent, t.root, false, h, o.categories);

  for (const r of t.replies) {
    if (ed?.mode === "edit" && ed.id === r.id && o.composer) o.composer(parent, false);
    else renderEntry(parent, r, true, h, o.categories);
  }

  if (ed?.mode === "reply" && ed.id === t.id && o.composer) {
    o.composer(parent, false);
  } else if (!editingRoot) {
    const reply = parent.createEl("button", { cls: "ma-reply-btn", text: "Répondre" });
    reply.addEventListener("click", (e) => {
      e.stopPropagation();
      h.onReply(t.id);
    });
  }
}

export class ConfirmModal extends Modal {
  constructor(app: App, private message: string, private onConfirm: () => void) {
    super(app);
  }

  onOpen() {
    this.titleEl.setText("Confirmer la suppression");
    this.contentEl.createEl("p", { text: this.message });
    const bar = this.contentEl.createDiv({ cls: "modal-button-container" });
    bar.createEl("button", { text: "Annuler" }).addEventListener("click", () => this.close());
    bar.createEl("button", { cls: "mod-warning", text: "Supprimer" }).addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
