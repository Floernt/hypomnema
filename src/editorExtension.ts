import { EditorState, Extension, Range, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { editorLivePreviewField, setIcon } from "obsidian";
import { parse, Parsed } from "./syntax";

/** Couleur d'une catégorie à partir de son tag (fournie par le plugin, selon les réglages). */
export type ColorOf = (tag?: string) => string | undefined;
let colorOf: ColorOf = () => undefined;

/** Force le recalcul des décorations (après un changement de réglages). */
export const refreshEffect = StateEffect.define<null>();

/** Mise en évidence temporaire d'un passage (navigation depuis le panneau). */
export const flashEffect = StateEffect.define<{ from: number; to: number } | null>();

export const parsedField = StateField.define<Parsed>({
  create: (state) => parse(state.doc.toString()),
  update: (value, tr) => (tr.docChanged ? parse(tr.state.doc.toString()) : value),
});

const flashField = StateField.define<{ from: number; to: number } | null>({
  create: () => null,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(flashEffect)) value = e.value;
    if (value && tr.docChanged) value = { from: tr.changes.mapPos(value.from), to: tr.changes.mapPos(value.to) };
    return value;
  },
});

class BlockWidget extends WidgetType {
  constructor(private count: number, private from: number) {
    super();
  }
  eq(o: BlockWidget) {
    return o.count === this.count && o.from === this.from;
  }
  toDOM(view: EditorView) {
    const el = document.createElement("div");
    el.className = "ma-block-widget";
    el.textContent = `💬 ${this.count} commentaire${this.count > 1 ? "s" : ""} — bloc d'annotations (cliquer pour l'afficher)`;
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      view.dispatch({ selection: { anchor: this.from + 3 } });
      view.focus();
    });
    return el;
  }
  ignoreEvent() {
    return false;
  }
}

/** Commentaire posé au curseur : une petite bulle à la place des deux marqueurs. */
class PointWidget extends WidgetType {
  constructor(private id: string, private color: string | undefined) {
    super();
  }
  eq(o: PointWidget) {
    return o.id === this.id && o.color === this.color;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = "ma-anchor ma-point";
    el.dataset.maId = this.id;
    if (this.color) el.style.setProperty("--ma-color", this.color);
    setIcon(el, "message-square");
    return el;
  }
  ignoreEvent() {
    return false;
  }
}

const hidden = Decoration.replace({});

function overlaps(state: EditorState, s: number, e: number): boolean {
  return state.selection.ranges.some((r) => (r.empty ? r.from > s && r.from < e : r.from < e && r.to > s));
}

function buildDecorations(state: EditorState): { decos: DecorationSet; atomic: DecorationSet } {
  const parsed = state.field(parsedField);
  const live = state.field(editorLivePreviewField, false) ?? false;
  const decos: Range<Decoration>[] = [];
  const atomic: Range<Decoration>[] = [];

  const tags = new Map(parsed.threads.map((t) => [t.id, t.root.tag]));
  for (const a of parsed.anchors) {
    const color = colorOf(tags.get(a.id));
    if (a.closeFrom === a.openTo) {
      // Point : bulle cliquable, sauf si le curseur est à l'intérieur des marqueurs (édition à la main).
      if (live && !overlaps(state, a.openFrom, a.closeTo)) {
        decos.push(Decoration.replace({ widget: new PointWidget(a.id, color) }).range(a.openFrom, a.closeTo));
      }
      if (live) atomic.push(hidden.range(a.openFrom, a.closeTo));
      continue;
    }
    const attributes: Record<string, string> = { "data-ma-id": a.id };
    if (color) attributes.style = `--ma-color: ${color}`;
    decos.push(Decoration.mark({ class: "ma-anchor", attributes }).range(a.openTo, a.closeFrom));
    if (!live) continue;
    for (const [s, e] of [[a.openFrom, a.openTo], [a.closeFrom, a.closeTo]]) {
      atomic.push(hidden.range(s, e));
      if (!overlaps(state, s, e)) decos.push(hidden.range(s, e));
    }
  }

  const b = parsed.block;
  const cursorInBlock = b && state.selection.ranges.some((r) => r.to >= b.from && r.from <= b.to);
  if (live && b && !cursorInBlock) {
    const count = parsed.threads.filter((t) => t.root.date).length;
    decos.push(Decoration.replace({ widget: new BlockWidget(count, b.from), block: true }).range(b.from, b.to));
  }

  const flash = state.field(flashField);
  if (flash && flash.to > flash.from) decos.push(Decoration.mark({ class: "ma-flash" }).range(flash.from, flash.to));

  return { decos: Decoration.set(decos, true), atomic: Decoration.set(atomic, true) };
}

const decorationField = StateField.define<{ decos: DecorationSet; atomic: DecorationSet }>({
  create: buildDecorations,
  update(value, tr) {
    const touched = tr.docChanged || tr.selection || tr.effects.some((e) => e.is(flashEffect) || e.is(refreshEffect));
    const modeChanged = tr.startState.field(editorLivePreviewField, false) !== tr.state.field(editorLivePreviewField, false);
    return touched || modeChanged ? buildDecorations(tr.state) : value;
  },
  provide: (f) => [
    EditorView.decorations.from(f, (v) => v.decos),
    EditorView.atomicRanges.of((view) => view.state.field(f).atomic),
  ],
});

/** Un clic sur un passage commenté ouvre son fil dans le panneau latéral. */
export function annotationExtension(onAnchorClick: (id: string) => void, resolveColor: ColorOf): Extension {
  colorOf = resolveColor;
  return [
    parsedField,
    flashField,
    decorationField,
    EditorView.domEventHandlers({
      click(e) {
        const id = (e.target as HTMLElement).closest<HTMLElement>(".ma-anchor")?.dataset.maId;
        if (id) onAnchorClick(id);
        return false;
      },
    }),
  ];
}
