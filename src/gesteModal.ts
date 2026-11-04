// Formulaire d'un geste : les seuls champs utiles à son type, les champs facultatifs repliés sous « Plus d'options ».

import { App, Modal, Notice, Setting } from "obsidian";
import { ExtractionFields, Geste, GesteKind, hasCycle, importGestes, isAdvanced, Step } from "./gestes";
import { t } from "./i18n";
import { listCommands, pluginEnabled, TEMPLATER } from "./integrations";
import { pick } from "./modals";
import type Hypomnema from "./main";

/** Champs propres à chaque type, pour un geste nouvellement créé. */
export function blankGeste(kind: GesteKind, id: string, base: ExtractionFields): Geste {
  const common = { id, name: "", command: true };
  if (kind === "annotation") return { ...common, kind, category: "", initialText: "" };
  if (kind === "extraction") return { ...common, kind, ...base, scope: "note", folderPath: "", folderMenu: false };
  if (kind === "chain") return { ...common, kind, steps: [] };
  return { ...common, kind, children: [] };
}

function formatOptions(): Record<string, string> {
  return { list: t("formatList"), table: t("formatTable"), kanban: t("formatKanban") };
}

function existingOptions(): Record<string, string> {
  return { "append-new": t("existingAppend"), replace: t("existingReplace") };
}

/** Champs facultatifs d'une extraction : filtres, gabarit, Templater, comportement sur une note existante. */
export function renderExtractionOptions(el: HTMLElement, app: App, plugin: Hypomnema, f: ExtractionFields, withExisting: boolean) {
  const cats = plugin.settings.categories.filter((c) => c.tag);
  if (cats.length) {
    new Setting(el).setName(t("filterCategories")).setDesc(t("filterCategoriesDesc"));
    for (const c of cats) {
      new Setting(el).setName(c.name || `#${c.tag}`).setClass("ma-setting-indent").addToggle((tg) =>
        tg.setValue(f.categories.includes(c.tag)).onChange((v) => {
          f.categories = v ? [...f.categories, c.tag] : f.categories.filter((x) => x !== c.tag);
        }),
      );
    }
  }
  new Setting(el)
    .setName(t("filterSince"))
    .setDesc(t("filterSinceDesc"))
    .addText((c) => c.setPlaceholder("{{date-7d}}").setValue(f.since).onChange((v) => (f.since = v)));
  new Setting(el).setName(t("settingsExtractReplies")).addToggle((c) => c.setValue(f.includeReplies).onChange((v) => (f.includeReplies = v)));
  new Setting(el)
    .setName(t("gesteTemplate"))
    .setDesc(t("gesteTemplateDesc"))
    .addText((c) => c.setPlaceholder("Templates/Review.md").setValue(f.template).onChange((v) => (f.template = v)));
  if (pluginEnabled(app, TEMPLATER) || f.templater) {
    new Setting(el)
      .setName(t("gesteTemplater"))
      .setDesc(t("gesteTemplaterDesc"))
      .addToggle((c) => c.setValue(f.templater).onChange((v) => (f.templater = v)));
  }
  if (withExisting) {
    new Setting(el)
      .setName(t("settingsExtractExisting"))
      .addDropdown((c) => c.addOptions(existingOptions()).setValue(f.onExisting).onChange((v) => (f.onExisting = v as ExtractionFields["onExisting"])));
  }
}

/** Options supplémentaires de l'extraction par défaut (section Extraction des réglages). */
export class DefaultExtractionModal extends Modal {
  constructor(app: App, private plugin: Hypomnema) {
    super(app);
  }

  onOpen() {
    this.titleEl.setText(`${t("settingsExtract")} · ${t("settingsExtractMore")}`);
    const f = { ...this.plugin.actions.defaultExtraction(), categories: [...this.plugin.settings.extract.categories] };
    renderExtractionOptions(this.contentEl, this.app, this.plugin, f, false);
    new Setting(this.contentEl)
      .addButton((b) => b.setButtonText(t("cancel")).onClick(() => this.close()))
      .addButton((b) =>
        b
          .setButtonText(t("save"))
          .setCta()
          .onClick(async () => {
            const { scope: _s, folderPath: _p, folderMenu: _m, ...extract } = f;
            this.plugin.settings.extract = extract;
            await this.plugin.saveSettings();
            this.close();
          }),
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class GesteModal extends Modal {
  private g: Geste;

  constructor(app: App, private plugin: Hypomnema, geste: Geste, private onSave: (g: Geste) => void | Promise<void>) {
    super(app);
    this.g = JSON.parse(JSON.stringify(geste)) as Geste;
  }

  onOpen() {
    this.titleEl.setText(`${t(`kind.${this.g.kind}`)}${this.g.name ? ` · ${this.g.name}` : ""}`);
    this.render();
  }

  onClose() {
    this.contentEl.empty();
  }

  private render() {
    const el = this.contentEl;
    el.empty();
    el.addClass("ma-geste-modal");
    const g = this.g;
    new Setting(el).setName(t("gesteName")).addText((c) => {
      c.setValue(g.name).onChange((v) => (g.name = v));
      if (!g.name) window.setTimeout(() => c.inputEl.focus(), 0);
    });

    if (g.kind === "annotation") this.annotation(el, g);
    else if (g.kind === "extraction") this.extraction(el, g);
    else if (g.kind === "chain") this.chain(el, g);
    else this.group(el, g);

    new Setting(el)
      .setName(t("gesteCommand"))
      .setDesc(t("gesteCommandDesc"))
      .addToggle((c) => c.setValue(g.command).onChange((v) => (g.command = v)));

    new Setting(el)
      .addButton((b) => b.setButtonText(t("cancel")).onClick(() => this.close()))
      .addButton((b) => b.setButtonText(t("save")).setCta().onClick(() => void this.save()));
  }

  private annotation(el: HTMLElement, g: Extract<Geste, { kind: "annotation" }>) {
    const options: Record<string, string> = { "": t("none"), ask: t("categoryAsk") };
    for (const c of this.plugin.settings.categories) if (c.tag) options[c.tag] = c.name || `#${c.tag}`;
    if (g.category && !(g.category in options)) options[g.category] = `#${g.category}`;
    new Setting(el).setName(t("gesteCategory")).addDropdown((c) => c.addOptions(options).setValue(g.category).onChange((v) => (g.category = v)));
    new Setting(el)
      .setName(t("gesteInitialText"))
      .setDesc(t("gesteInitialTextDesc"))
      .addTextArea((c) => {
        c.setValue(g.initialText).onChange((v) => (g.initialText = v));
        c.inputEl.rows = 3;
      });
  }

  private extraction(el: HTMLElement, g: Extract<Geste, { kind: "extraction" }>) {
    const scopes: Record<string, string> = {};
    for (const s of ["note", "folder-current", "folder", "vault", "context"] as const) scopes[s] = t(`scope.${s}`);
    new Setting(el).setName(t("gesteScope")).addDropdown((c) =>
      c
        .addOptions(scopes)
        .setValue(g.scope)
        .onChange((v) => {
          g.scope = v as typeof g.scope;
          this.render();
        }),
    );
    if (g.scope === "folder") {
      new Setting(el).setName(t("gesteFolderPath")).addText((c) => c.setValue(g.folderPath).onChange((v) => (g.folderPath = v.trim())));
    }
    new Setting(el).setName(t("settingsExtractFormat")).addDropdown((c) =>
      c
        .addOptions(formatOptions())
        .setValue(g.format)
        .onChange((v) => {
          g.format = v as typeof g.format;
          this.render();
        }),
    );
    new Setting(el)
      .setName(t("settingsExtractFolder"))
      .setDesc(t("settingsExtractFolderDesc"))
      .addText((c) => c.setValue(g.folder).onChange((v) => (g.folder = v.trim())));
    new Setting(el)
      .setName(t("settingsExtractFileName"))
      .setDesc(t("settingsExtractFileNameDesc"))
      .addText((c) => c.setValue(g.fileName).onChange((v) => (g.fileName = v)));
    if (g.format !== "table") {
      new Setting(el)
        .setName(t("settingsExtractTemplate"))
        .setDesc(t("settingsExtractTemplateDesc"))
        .addTextArea((c) => c.setValue(g.lineTemplate).onChange((v) => (g.lineTemplate = v)));
    }
    const more = el.createEl("details", { cls: "ma-more" });
    more.createEl("summary", { text: t("moreOptions") });
    more.open = !!(g.categories.length || g.since || g.template || g.templater || g.folderMenu);
    new Setting(more)
      .setName(t("gesteFolderMenu"))
      .setDesc(t("gesteFolderMenuDesc"))
      .addToggle((c) => c.setValue(g.folderMenu).onChange((v) => (g.folderMenu = v)));
    renderExtractionOptions(more, this.app, this.plugin, g, true);
  }

  /** Autres gestes, qu'un enchaînement ou un groupe peut appeler. */
  private others(): Geste[] {
    return this.plugin.settings.actions.filter((x) => x.id !== this.g.id);
  }

  private chain(el: HTMLElement, g: Extract<Geste, { kind: "chain" }>) {
    new Setting(el).setName(t("chainSteps")).setHeading();
    if (!g.steps.length) el.createDiv({ cls: "setting-item-description", text: t("chainNoStep") });
    const others = this.others();
    const types: Record<Exclude<Step["type"], "script">, string> = {
      action: t("step.action"),
      command: t("step.command"),
      wait: t("step.wait"),
    };
    g.steps.forEach((step, i) => {
      const s = new Setting(el).setClass("ma-step");
      if (step.type === "script") {
        // Étape retirée en 0.6.0 : affichée pour être supprimée, plus modifiable.
        s.setName(t("step.script")).setDesc(t("stepScriptRemovedDesc", { path: step.path }));
      } else {
        s.addDropdown((c) =>
          c
            .addOptions(types)
            .setValue(step.type)
            .onChange((v) => {
              const type = v as keyof typeof types;
              g.steps[i] = type === "action" ? { type, id: others[0]?.id ?? "" } : type === "wait" ? { type, ms: 500 } : { type, id: "" };
              this.render();
            }),
        );
      }
      if (step.type === "action") {
        const opts: Record<string, string> = {};
        for (const o of others) opts[o.id] = o.name;
        s.addDropdown((c) => c.addOptions(opts).setValue(step.id).onChange((v) => (step.id = v)));
      } else if (step.type === "command") {
        const name = listCommands(this.app).find((c) => c.id === step.id)?.name ?? step.id;
        s.setDesc(name);
        s.addButton((b) =>
          b.setButtonText(t("chooseCommand")).onClick(async () => {
            const cmd = await pick(this.app, listCommands(this.app), (c) => c.name, t("pickCommand"));
            if (cmd) {
              step.id = cmd.id;
              this.render();
            }
          }),
        );
      } else if (step.type === "wait") {
        s.addText((c) => c.setValue(String(step.ms)).onChange((v) => (step.ms = Math.max(0, Number(v) || 0))));
      }
      s.addExtraButton((b) => b.setIcon("arrow-up").setTooltip(t("moveUp")).setDisabled(i === 0).onClick(() => this.move(g.steps, i, -1)));
      s.addExtraButton((b) =>
        b.setIcon("arrow-down").setTooltip(t("moveDown")).setDisabled(i === g.steps.length - 1).onClick(() => this.move(g.steps, i, 1)),
      );
      s.addExtraButton((b) =>
        b.setIcon("trash-2").setTooltip(t("deleteStep")).onClick(() => {
          g.steps.splice(i, 1);
          this.render();
        }),
      );
    });
    new Setting(el).addButton((b) =>
      b.setButtonText(t("addStep")).onClick(() => {
        g.steps.push(others.length ? { type: "action", id: others[0].id } : { type: "command", id: "" });
        this.render();
      }),
    );
  }

  private move<T>(list: T[], i: number, delta: number) {
    const [x] = list.splice(i, 1);
    list.splice(i + delta, 0, x);
    this.render();
  }

  private group(el: HTMLElement, g: Extract<Geste, { kind: "group" }>) {
    new Setting(el).setName(t("groupChildren")).setHeading();
    for (const o of this.others()) {
      new Setting(el)
        .setName(o.name)
        .setDesc(t(`kind.${o.kind}`))
        .addToggle((c) =>
          c.setValue(g.children.includes(o.id)).onChange((v) => {
            g.children = v ? [...g.children, o.id] : g.children.filter((x) => x !== o.id);
          }),
        );
    }
  }

  private async save() {
    const g = this.g;
    g.name = g.name.trim();
    if (!g.name) {
      new Notice(t("gesteNameRequired"));
      return;
    }
    if (isAdvanced(g)) {
      const all = this.plugin.settings.actions.filter((x) => x.id !== g.id).concat(g);
      if (hasCycle(g.id, all)) {
        new Notice(t("gesteCycle"));
        return;
      }
    }
    await this.onSave(g);
    this.close();
  }
}

/** Import de gestes : on colle un export JSON. */
export class ImportModal extends Modal {
  constructor(app: App, private plugin: Hypomnema, private onDone: () => void) {
    super(app);
  }

  onOpen() {
    this.titleEl.setText(t("settingsImport"));
    let text = "";
    new Setting(this.contentEl).setDesc(t("settingsImportDesc"));
    const area = this.contentEl.createEl("textarea", { cls: "ma-import", attr: { rows: "10", placeholder: t("importPlaceholder") } });
    area.addEventListener("input", () => (text = area.value));
    new Setting(this.contentEl)
      .addButton((b) => b.setButtonText(t("cancel")).onClick(() => this.close()))
      .addButton((b) => b.setButtonText(t("importButton")).setCta().onClick(() => void this.import(text)));
  }

  private async import(text: string) {
    const s = this.plugin.settings;
    let result;
    try {
      result = importGestes(text, s.actions, s.categories.map((c) => c.tag));
    } catch {
      new Notice(t("importInvalid"));
      return;
    }
    s.actions.push(...result.gestes);
    await this.plugin.saveSettings();
    new Notice(t("importDone", { n: result.gestes.length }));
    if (result.missingCategories.length) new Notice(t("importMissing", { tags: result.missingCategories.map((x) => `#${x}`).join(", ") }));
    this.close();
    this.onDone();
  }

  onClose() {
    this.contentEl.empty();
  }
}
