import { EditorState, Extension, Range, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { ClassOf, flashEffect, parsedField, refreshEffect } from "./editorExtension";
import { layout } from "./marginLayout";
import type { Thread } from "./syntax";
import { t } from "./i18n";

// Commentaires en marge : à droite du texte quand la place le permet, sous le paragraphe sinon.
// La rédaction reste dans le panneau ; un clic sur une note de marge y ouvre son fil.

export interface MarginOptions {
  enabled: () => boolean;
  content: () => "comment" | "thread";
  classOf: ClassOf;
  onOpen: (id: string) => void;
}

/** Largeur sous laquelle la marge est jugée trop étroite : les notes passent sous le paragraphe. */
const MIN_WIDTH = 180;
const MAX_WIDTH = 280;
const OFFSET = 24; // écart entre le texte et la marge

let opts: MarginOptions = { enabled: () => false, content: () => "comment", classOf: () => "", onOpen: () => {} };

/** Fils affichables : ancrés dans le texte et déjà enregistrés (un brouillon n'a pas encore de date). */
function shown(state: EditorState): Thread[] {
  return state.field(parsedField).threads.filter((th) => th.anchor && th.root.date);
}

function noteContent(el: HTMLElement, th: Thread) {
  el.empty();
  if (th.root.text) el.createDiv({ cls: "ma-margin-text", text: th.root.text });
  if (!th.replies.length) return;
  if (opts.content() === "thread") {
    for (const r of th.replies) el.createDiv({ cls: "ma-margin-reply", text: r.text });
  } else {
    el.createDiv({ cls: "ma-margin-count", text: t("marginReplies", { n: th.replies.length }) });
  }
}

function noteEl(view: EditorView, th: Thread, cls: string): HTMLElement {
  const el = createDiv({ cls: `${cls} ${opts.classOf(th.root.tag)}`.trim() });
  el.dataset.maId = th.id;
  noteContent(el, th);
  const a = th.anchor!;
  const range = a.closeFrom > a.openTo ? { from: a.openTo, to: a.closeFrom } : { from: a.openFrom, to: a.closeTo };
  el.addEventListener("mousedown", (e) => {
    e.preventDefault();
    opts.onOpen(th.id);
  });
  el.addEventListener("mouseenter", () => view.dispatch({ effects: flashEffect.of(range) }));
  el.addEventListener("mouseleave", () => view.dispatch({ effects: flashEffect.of(null) }));
  return el;
}

/** Signature d'un fil, pour ne redessiner une note que si son contenu a changé. */
const signature = (th: Thread) => [th.root.tag, th.root.text, ...th.replies.map((r) => r.text), opts.content()].join("\u0000");

// --- Panneau étroit : la note s'affiche sous le paragraphe, comme un widget de bloc ---

const narrowEffect = StateEffect.define<boolean>();

const narrowField = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(narrowEffect)) value = e.value;
    return value;
  },
});

class BelowWidget extends WidgetType {
  constructor(private th: Thread, private sig: string) {
    super();
  }
  eq(o: BelowWidget) {
    return o.th.id === this.th.id && o.sig === this.sig;
  }
  toDOM(view: EditorView) {
    // CodeMirror ne compte pas les marges d'un widget de bloc : l'espacement passe par le rembourrage d'une enveloppe.
    const wrap = createDiv({ cls: "ma-below" });
    wrap.appendChild(noteEl(view, this.th, "ma-below-note"));
    return wrap;
  }
  ignoreEvent() {
    return true;
  }
}

function buildBelow(state: EditorState): DecorationSet {
  if (!opts.enabled() || !state.field(narrowField)) return Decoration.none;
  const decos: Range<Decoration>[] = [];
  for (const th of shown(state)) {
    const end = state.doc.lineAt(th.anchor!.closeTo).to;
    decos.push(Decoration.widget({ widget: new BelowWidget(th, signature(th)), block: true, side: 1 }).range(end));
  }
  return Decoration.set(decos, true);
}

const belowField = StateField.define<DecorationSet>({
  create: buildBelow,
  update(value, tr) {
    const touched = tr.docChanged || tr.effects.some((e) => e.is(narrowEffect) || e.is(refreshEffect));
    return touched ? buildBelow(tr.state) : value.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

// --- Panneau large : un calque absolu dans la zone de défilement, à droite du texte ---

interface Measure {
  narrow: boolean;
  left: number;
  width: number;
  anchors: { id: string; top: number }[];
  heights: Map<string, number>;
}

class MarginLayer {
  private layer: HTMLElement;
  private notes = new Map<string, { el: HTMLElement; sig: string }>();

  constructor(private view: EditorView) {
    this.layer = view.scrollDOM.createDiv({ cls: "ma-margin" });
    this.schedule();
  }

  update(u: ViewUpdate) {
    const refresh = u.transactions.some((tr) => tr.effects.some((e) => e.is(refreshEffect)));
    if (u.docChanged || u.viewportChanged || u.geometryChanged || u.selectionSet || refresh) this.schedule();
  }

  destroy() {
    this.layer.remove();
  }

  private schedule() {
    this.view.requestMeasure({ key: this, read: () => this.read(), write: (m) => this.write(m) });
  }

  private read(): Measure | null {
    if (!opts.enabled()) return null;
    const scroller = this.view.scrollDOM.getBoundingClientRect();
    const content = this.view.contentDOM.getBoundingClientRect();
    const available = scroller.right - content.right - OFFSET * 2;
    const narrow = available < MIN_WIDTH;
    const base = scroller.top - this.view.scrollDOM.scrollTop;
    const { from, to } = this.view.viewport;
    const anchors: Measure["anchors"] = [];
    if (!narrow) {
      for (const th of shown(this.view.state)) {
        const pos = th.anchor!.openTo;
        if (pos < from || pos > to) continue;
        const c = this.view.coordsAtPos(pos);
        if (c) anchors.push({ id: th.id, top: c.top - base });
      }
    }
    const heights = new Map<string, number>();
    for (const [id, n] of this.notes) heights.set(id, n.el.offsetHeight);
    return {
      narrow,
      left: content.right - scroller.left + this.view.scrollDOM.scrollLeft + OFFSET,
      width: Math.min(MAX_WIDTH, available),
      anchors,
      heights,
    };
  }

  private write(m: Measure | null) {
    const narrow = !!m?.narrow;
    if (narrow !== this.view.state.field(narrowField)) {
      // Pas de transaction pendant une mesure : on attend la fin du cycle.
      window.setTimeout(() => this.view.dispatch({ effects: narrowEffect.of(narrow) }));
    }
    if (!m || narrow) {
      this.layer.empty();
      this.notes.clear();
      return;
    }

    const threads = new Map(shown(this.view.state).map((th) => [th.id, th]));
    const visible = new Set(m.anchors.map((a) => a.id));
    for (const [id, n] of this.notes) {
      if (!visible.has(id)) {
        n.el.remove();
        this.notes.delete(id);
      }
    }
    let added = false;
    for (const id of visible) {
      const th = threads.get(id)!;
      const sig = signature(th) + opts.classOf(th.root.tag);
      const existing = this.notes.get(id);
      if (existing?.sig === sig) continue;
      const el = noteEl(this.view, th, "ma-margin-note");
      if (existing) existing.el.replaceWith(el);
      else this.layer.appendChild(el);
      this.notes.set(id, { el, sig });
      added = true;
    }

    const sel = this.view.state.selection.main.head;
    const items = m.anchors.map((a) => ({ id: a.id, top: a.top, height: m.heights.get(a.id) ?? 40 }));
    for (const { id, top } of layout(items)) {
      const n = this.notes.get(id)!;
      const a = threads.get(id)!.anchor!;
      n.el.toggleClass("is-active", sel >= a.openFrom && sel <= a.closeTo);
      n.el.setCssProps({ "--ma-top": `${top}px`, "--ma-left": `${m.left}px`, "--ma-width": `${m.width}px` });
    }
    // Les notes créées n'ont pas encore de hauteur connue : une seconde passe les place sans chevauchement.
    if (added) this.schedule();
  }
}

const marginLayer = ViewPlugin.fromClass(MarginLayer);

export function marginExtension(options: MarginOptions): Extension {
  opts = options;
  return [narrowField, belowField, marginLayer];
}
