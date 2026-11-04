// Exécution des gestes : commandes, saisies {{VALUE:…}}, enchaînements et groupes.

import { MarkdownView, normalizePath, Notice, TFile, TFolder } from "obsidian";
import { today } from "./actions";
import { format, promptsIn, takeCursor } from "./format";
import { AnnotationGeste, ChainGeste, ExtractionGeste, Geste, GroupGeste, Step } from "./gestes";
import { t } from "./i18n";
import { executeCommand } from "./integrations";
import { pick, promptValue } from "./modals";
import type Hypomnema from "./main";

/** L'utilisateur a renoncé (saisie ou choix annulé) : on s'arrête sans message d'erreur. */
class Cancelled extends Error {}

interface RunState {
  /** Réponses aux {{VALUE:…}}, partagées par toutes les étapes d'un enchaînement. */
  values: Record<string, string>;
  /** Gestes en cours, pour refuser qu'un geste se relance lui-même. */
  stack: string[];
  ctx: { file?: TFile | null; folder?: TFolder };
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export class GesteRunner {
  /** Commandes enregistrées : identifiant du geste → nom affiché. */
  private registered = new Map<string, string>();

  constructor(private plugin: Hypomnema) {}

  private get app() {
    return this.plugin.app;
  }

  find(id: string): Geste | undefined {
    return this.plugin.settings.actions.find((g) => g.id === id);
  }

  /** Aligne les commandes « hypomnema:action-<id> » sur la liste des gestes, sans recharger le plugin. */
  syncCommands() {
    const want = new Map(this.plugin.settings.actions.filter((g) => g.command).map((g) => [g.id, g.name || g.id]));
    for (const [id, name] of this.registered) {
      if (want.get(id) === name) continue;
      this.plugin.removeCommand(`action-${id}`);
      this.registered.delete(id);
    }
    for (const [id, name] of want) {
      if (this.registered.has(id)) continue;
      this.plugin.addCommand({ id: `action-${id}`, name, callback: () => void this.run(id) });
      this.registered.set(id, name);
    }
  }

  /** Commande « Lancer un geste » : choisir parmi tous les gestes. */
  async choose() {
    const g = await pick(this.app, this.plugin.settings.actions, (x) => `${x.name} · ${t(`kind.${x.kind}`)}`, t("pickGeste"));
    if (g) await this.run(g.id);
  }

  async run(id: string, opts: { values?: Record<string, string>; ctx?: RunState["ctx"] } = {}): Promise<void> {
    const g = this.find(id);
    if (!g) {
      new Notice(t("gesteNotFound", { id }));
      return;
    }
    const state: RunState = { values: { ...opts.values }, stack: [], ctx: opts.ctx ?? {} };
    try {
      await this.exec(g, state);
    } catch (e) {
      if (e instanceof Cancelled) return;
      new Notice(t("gesteError", { name: g.name, msg: e instanceof Error ? e.message : String(e) }));
    }
  }

  private async exec(g: Geste, state: RunState): Promise<void> {
    if (state.stack.includes(g.id)) throw new Error(t("gesteCycle"));
    state.stack.push(g.id);
    try {
      if (g.kind === "annotation") await this.annotation(g, state);
      else if (g.kind === "extraction") await this.extraction(g, state);
      else if (g.kind === "chain") await this.chain(g, state);
      else await this.group(g, state);
    } finally {
      state.stack.pop();
    }
  }

  /** Demande les {{VALUE:…}} des textes qui n'ont pas encore de réponse. */
  private async ask(texts: string[], state: RunState) {
    for (const label of promptsIn(texts, this.plugin.actions.globals())) {
      if (state.values[label] !== undefined) continue;
      const v = await promptValue(this.app, label);
      if (v === null) throw new Cancelled();
      state.values[label] = v;
    }
  }

  private async annotation(g: AnnotationGeste, state: RunState) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) throw new Error(t("gesteNeedsNote"));
    await this.ask([g.initialText], state);
    let tag: string | undefined = g.category || undefined;
    if (g.category === "ask") {
      const none = { name: t("none"), tag: "", color: "" };
      const chosen = await pick(this.app, [none, ...this.plugin.settings.categories.filter((c) => c.tag)], (c) => c.name || `#${c.tag}`, t("pickCategory"));
      if (!chosen) throw new Cancelled();
      tag = chosen.tag || undefined;
    }
    const text = format(g.initialText, {
      vars: { selection: view.editor.getSelection(), note: view.file.basename },
      today: today(),
      globals: this.plugin.actions.globals(),
      values: state.values,
      formatDate: this.plugin.actions.formatDate,
    });
    this.plugin.actions.startDraft(view, { tag, ...takeCursor(text) });
  }

  private async extraction(g: ExtractionGeste, state: RunState) {
    const templateText = g.template.trim() ? await this.readTemplate(g.template) : undefined;
    await this.ask([g.folder, g.fileName, g.lineTemplate, g.since, templateText ?? ""], state);
    await this.plugin.actions.extractWith(g, state.ctx, { values: state.values, templateText });
  }

  /** Contenu d'une note-gabarit ; l'extension .md peut être omise. */
  async readTemplate(path: string): Promise<string> {
    const vault = this.app.vault;
    const p = normalizePath(path.trim());
    const file = vault.getAbstractFileByPath(p) ?? vault.getAbstractFileByPath(`${p}.md`);
    if (!(file instanceof TFile)) throw new Error(t("fileMissing", { path }));
    return vault.cachedRead(file);
  }

  private async chain(g: ChainGeste, state: RunState) {
    for (const step of g.steps) await this.step(step, state);
  }

  private async step(step: Step, state: RunState) {
    if (step.type === "action") {
      const child = this.find(step.id);
      if (!child) throw new Error(t("gesteNotFound", { id: step.id }));
      await this.exec(child, state);
    } else if (step.type === "command") {
      if (!executeCommand(this.app, step.id)) throw new Error(t("gesteNotFound", { id: step.id }));
    } else if (step.type === "wait") {
      await sleep(step.ms);
    } else {
      // Étape retirée en 0.6.0 : le JavaScript passe par QuickAdd ou Templater, qui appellent l'API.
      throw new Error(t("stepScriptRemoved", { path: step.path }));
    }
  }

  private async group(g: GroupGeste, state: RunState) {
    const children = g.children.map((id) => this.find(id)).filter((x): x is Geste => !!x);
    const chosen = await pick(this.app, children, (x) => x.name, g.name);
    if (!chosen) throw new Cancelled();
    await this.exec(chosen, state);
  }
}
