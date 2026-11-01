import { App, Notice, PluginSettingTab, requireApiVersion, Setting, SettingDefinitionItem } from "obsidian";
import type Hypomnema from "./main";
import { exportGestes, ExtractionFields, Geste, GesteKind, newId, upgradeGestes } from "./gestes";
import { blankGeste, DefaultExtractionModal, GesteModal, ImportModal } from "./gesteModal";
import { t } from "./i18n";
import { DATAVIEW, pluginEnabled, QUICKADD } from "./integrations";
import { pick } from "./modals";

const SITE = "https://hypomnema.tools";

/** Adresse d'une page du site de documentation, dans la langue de l'interface. */
export function docUrl(path: string): string {
  return `${SITE}${t("docLang")}/${path}/`;
}

/** Description suivie d'un lien vers le site (« Méthode », « Recettes »…). */
function withLink(desc: string, label: string, path: string): DocumentFragment {
  return createFragment((f) => {
    f.appendText(`${desc} `);
    f.createEl("a", { text: label, href: docUrl(path) });
  });
}

export interface Category {
  name: string;
  color: string;
  tag: string; // sans « # »
}

export interface DisplaySettings {
  margin: boolean;
  marginContent: "comment" | "thread";
}

/** L'extraction par défaut : celle des commandes « Extraire les commentaires » et du menu des dossiers. */
export type ExtractSettings = Omit<ExtractionFields, "scope" | "folderPath" | "folderMenu">;

export interface GlobalVariable {
  name: string;
  value: string;
}

export interface Settings {
  categories: Category[];
  display: DisplaySettings;
  extract: ExtractSettings;
  actions: Geste[];
  globals: GlobalVariable[];
  /** Affiche enchaînements, groupes, scripts, export et import. */
  advanced: boolean;
  /** Scripts déjà acceptés, avec l'empreinte du code accepté : un script modifié est redemandé. */
  trustedScripts: Record<string, string>;
  /** Tags ajoutés par le plugin, par chemin de note : seuls ceux-là peuvent être retirés automatiquement. */
  addedTags: Record<string, string[]>;
}

/** Réglages initiaux, avec une catégorie d'exemple dans la langue d'Obsidian. La marge est désactivée par défaut. */
export function defaultSettings(): Settings {
  return {
    categories: [{ name: t("defaultCategoryName"), color: "#2e9e5b", tag: t("defaultCategoryTag") }],
    display: { margin: false, marginContent: "comment" },
    extract: {
      folder: "",
      fileName: t("defaultFileName"),
      format: "list",
      lineTemplate: t("defaultLineTemplate"),
      includeReplies: true,
      onExisting: "append-new",
      categories: [],
      since: "",
      template: "",
      templater: false,
    },
    actions: [],
    globals: [],
    advanced: false,
    trustedScripts: {},
    addedTags: {},
  };
}

/** Réglages enregistrés, complétés par les valeurs par défaut des champs apparus dans une version ultérieure. */
export function mergeSettings(data: (Partial<Settings> & { gestes?: Geste[] }) | null): Settings {
  const d = defaultSettings();
  return {
    categories: data?.categories ?? d.categories,
    display: { ...d.display, ...data?.display },
    extract: { ...d.extract, ...data?.extract },
    // « gestes » : nom de la clé pendant le développement des actions.
    actions: upgradeGestes(data?.actions ?? data?.gestes ?? []),
    globals: data?.globals ?? [],
    advanced: data?.advanced ?? false,
    trustedScripts: data?.trustedScripts ?? {},
    addedTags: data?.addedTags ?? {},
  };
}

/** Réglages simples, adressés par une clé « section.champ » ou « advanced » (API déclarative des réglages). */
type Section = "display" | "extract";

/** « #Droit privé » → « Droit-privé » : un tag Obsidian n'admet ni espace ni « # ». */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, "-");
}

/** Nombre de classes .ma-cat-i déclarées dans styles.css ; au-delà, la couleur par défaut s'applique. */
export const MAX_CATEGORIES = 20;

/** Classe CSS portant la couleur de la catégorie d'un tag ; chaîne vide si le tag n'est rattaché à aucune catégorie. */
export function categoryClass(categories: Category[], tag?: string): string {
  if (!tag) return "";
  const i = categories.findIndex((c) => c.tag === tag);
  return i < 0 || i >= MAX_CATEGORIES ? "" : `ma-cat-${i}`;
}

/**
 * Variables CSS des couleurs, posées sur <body> : .ma-cat-i lit --ma-cat-i-color (styles.css).
 * Toutes les variables sont renvoyées, vides pour les catégories absentes ou invalides, afin d'effacer les anciennes valeurs.
 */
export function categoryVars(categories: Category[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < MAX_CATEGORIES; i++) {
    const color = categories[i]?.color ?? "";
    vars[`--ma-cat-${i}-color`] = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "";
  }
  return vars;
}

export class SettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: Hypomnema) {
    super(app, plugin);
  }

  private async save() {
    await this.plugin.saveSettings();
  }

  /** Champs d'une catégorie (nom, couleur, tag), communs aux deux rendus des réglages. */
  private categoryRow(setting: Setting, cat: Category) {
    setting
      .setName(cat.name || t("newCategory"))
      .addText((c) =>
        c.setPlaceholder(t("settingsName")).setValue(cat.name).onChange(async (v) => {
          cat.name = v;
          setting.setName(v || t("newCategory"));
          await this.save();
        }),
      )
      .addColorPicker((c) => c.setValue(cat.color).onChange(async (v) => ((cat.color = v), await this.save())))
      .addText((c) =>
        c.setPlaceholder(t("settingsTag")).setValue(cat.tag).onChange(async (v) => ((cat.tag = normalizeTag(v)), await this.save())),
      );
  }

  private async addCategory() {
    this.plugin.settings.categories.push({ name: "", color: "#3b82f6", tag: "" });
    await this.save();
  }

  private async deleteCategory(i: number) {
    this.plugin.settings.categories.splice(i, 1);
    await this.save();
  }

  /** Réglages déclaratifs (Obsidian 1.13 et suivants) : ils apparaissent dans la recherche des paramètres. */
  getSettingDefinitions(): SettingDefinitionItem[] {
    if (!requireApiVersion("1.13.0")) return [];
    const categories = this.plugin.settings.categories;
    const s = this.plugin.settings;
    return [
      { name: t("settingsCategories"), desc: withLink(t("settingsIntro"), t("docMethod"), "method/categories") },
      {
        type: "list",
        items: categories.map((cat) => ({
          name: cat.name || t("newCategory"),
          aliases: cat.tag ? [cat.tag] : [],
          render: (setting: Setting) => this.categoryRow(setting, cat),
        })),
        emptyState: t("settingsNoCategory"),
        onDelete: (i) => void this.deleteCategory(i).then(() => this.refresh()),
        addItem: { name: t("addCategory"), action: () => void this.addCategory().then(() => this.refresh()) },
      },
      {
        type: "group",
        heading: t("settingsDisplay"),
        items: [
          { name: t("settingsMargin"), desc: withLink(t("settingsMarginDesc"), t("docMethod"), "method/margin"), control: { type: "toggle", key: "display.margin" } },
          {
            name: t("settingsMarginContent"),
            control: { type: "dropdown", key: "display.marginContent", options: this.marginContentOptions() },
            visible: () => this.plugin.settings.display.margin,
          },
        ],
      },
      {
        type: "group",
        heading: t("settingsExtract"),
        items: [
          { name: t("settingsExtract"), desc: withLink(t("settingsExtractDesc"), t("docMethod"), "method/periodic-review") },
          { name: t("settingsExtractFormat"), control: { type: "dropdown", key: "extract.format", options: this.formatOptions() } },
          { name: t("settingsExtractFolder"), desc: t("settingsExtractFolderDesc"), control: { type: "folder", key: "extract.folder" } },
          { name: t("settingsExtractFileName"), desc: t("settingsExtractFileNameDesc"), control: { type: "text", key: "extract.fileName" } },
          {
            name: t("settingsExtractTemplate"),
            desc: t("settingsExtractTemplateDesc"),
            control: { type: "textarea", key: "extract.lineTemplate", rows: 2 },
            visible: () => this.plugin.settings.extract.format !== "table",
          },
          { name: t("settingsExtractReplies"), control: { type: "toggle", key: "extract.includeReplies" } },
          { name: t("settingsExtractExisting"), control: { type: "dropdown", key: "extract.onExisting", options: this.existingOptions() } },
          { name: t("settingsExtractMore"), desc: t("settingsExtractMoreDesc"), action: () => new DefaultExtractionModal(this.app, this.plugin).open() },
          ...(pluginEnabled(this.app, DATAVIEW) ? [{ name: "Dataview", desc: withLink(t("hintDataview"), t("hintLink"), "integrations/dataview") }] : []),
        ],
      },
      {
        type: "group",
        heading: t("settingsGestes"),
        items: [
          { name: t("settingsGestes"), desc: withLink(t("settingsGestesDesc"), t("docMethod"), "concepts/actions") },
          ...(pluginEnabled(this.app, QUICKADD) ? [{ name: "QuickAdd", desc: withLink(t("hintQuickAdd"), t("hintLink"), "integrations/quickadd") }] : []),
        ],
      },
      {
        type: "list",
        items: s.actions.map((g, i) => ({
          name: g.name,
          desc: t(`kind.${g.kind}`),
          render: (setting: Setting) => this.gesteRow(setting, g, i, false),
        })),
        emptyState: t("settingsNoGeste"),
        onReorder: (from, to) => void this.moveGeste(from, to),
        onDelete: (i) => void this.deleteGeste(i),
        addItem: { name: t("addGeste"), action: () => void this.addGeste() },
      },
      {
        type: "list",
        heading: t("settingsGlobals"),
        items: s.globals.map((v) => ({ name: v.name || t("globalName"), render: (setting: Setting) => this.globalRow(setting, v) })),
        emptyState: withLink(t("settingsGlobalsDesc"), t("docMethod"), "concepts/variables"),
        onDelete: (i) => void this.deleteGlobal(i),
        addItem: { name: t("addGlobal"), action: () => void this.addGlobal() },
      },
      {
        type: "group",
        heading: t("settingsAdvanced"),
        items: [
          { name: t("settingsAdvanced"), desc: withLink(t("settingsAdvancedDesc"), t("docMethod"), "advanced/scripts"), control: { type: "toggle", key: "advanced" } },
          { name: t("settingsExport"), desc: t("settingsExportDesc"), action: () => void this.exportAll(), visible: () => this.plugin.settings.advanced },
          {
            name: t("settingsImport"),
            desc: t("settingsImportDesc"),
            action: () => new ImportModal(this.app, this.plugin, () => this.refresh()).open(),
            visible: () => this.plugin.settings.advanced,
          },
        ],
      },
    ];
  }

  /** Ligne d'un geste : modifier, monter, descendre (et supprimer, dans le rendu hérité). */
  private gesteRow(setting: Setting, g: Geste, i: number, legacy: boolean) {
    const n = this.plugin.settings.actions.length;
    setting.setName(g.name).setDesc(t(`kind.${g.kind}`) + (g.command ? "" : " · " + t("gesteCommand").toLowerCase() + " ✗"));
    setting.addExtraButton((b) => b.setIcon("pencil").setTooltip(t("editGeste")).onClick(() => this.editGeste(i)));
    if (!legacy) return;
    setting.addExtraButton((b) => b.setIcon("arrow-up").setTooltip(t("moveUp")).setDisabled(i === 0).onClick(() => void this.moveGeste(i, i - 1)));
    setting.addExtraButton((b) => b.setIcon("arrow-down").setTooltip(t("moveDown")).setDisabled(i === n - 1).onClick(() => void this.moveGeste(i, i + 1)));
    setting.addExtraButton((b) => b.setIcon("trash-2").setTooltip(t("deleteGeste")).onClick(() => void this.deleteGeste(i)));
  }

  private editGeste(i: number) {
    const g = this.plugin.settings.actions[i];
    if (!g) return;
    new GesteModal(this.app, this.plugin, g, async (edited) => {
      this.plugin.settings.actions[i] = edited;
      await this.save();
      this.refresh();
    }).open();
  }

  private async addGeste() {
    const kinds: GesteKind[] = this.plugin.settings.advanced ? ["annotation", "extraction", "chain", "group"] : ["annotation", "extraction"];
    const kind = await pick(this.app, kinds, (k) => t(`kind.${k}`), t("addGeste"));
    if (!kind) return;
    const g = blankGeste(kind, newId(this.plugin.settings.actions.map((x) => x.id)), this.plugin.actions.defaultExtraction());
    new GesteModal(this.app, this.plugin, g, async (created) => {
      this.plugin.settings.actions.push(created);
      await this.save();
      this.refresh();
    }).open();
  }

  private async moveGeste(from: number, to: number) {
    const list = this.plugin.settings.actions;
    if (from < 0 || to < 0 || from >= list.length || to >= list.length) return this.refresh();
    const [g] = list.splice(from, 1);
    list.splice(to, 0, g);
    await this.save();
    this.refresh();
  }

  private async deleteGeste(i: number) {
    if (i < 0) return this.refresh();
    this.plugin.settings.actions.splice(i, 1);
    await this.save();
    this.refresh();
  }

  private globalRow(setting: Setting, v: GlobalVariable) {
    setting
      .setName("")
      .addText((c) => c.setPlaceholder(t("globalName")).setValue(v.name).onChange(async (x) => ((v.name = x.trim()), await this.save())))
      .addText((c) => c.setPlaceholder(t("globalValue")).setValue(v.value).onChange(async (x) => ((v.value = x), await this.save())));
  }

  private async addGlobal() {
    this.plugin.settings.globals.push({ name: "", value: "" });
    await this.save();
    this.refresh();
  }

  private async deleteGlobal(i: number) {
    if (i >= 0) this.plugin.settings.globals.splice(i, 1);
    await this.save();
    this.refresh();
  }

  private async exportAll() {
    const gestes = this.plugin.settings.actions;
    await navigator.clipboard.writeText(exportGestes(gestes));
    new Notice(t("exportDone", { n: gestes.length }));
  }

  getControlValue(key: string): unknown {
    if (key === "advanced") return this.plugin.settings.advanced;
    const [section, field] = key.split(".") as [Section, string];
    return (this.plugin.settings[section] as unknown as Record<string, unknown>)[field];
  }

  async setControlValue(key: string, value: unknown) {
    await this.setValue(key, value);
    // Le contenu de la marge et le gabarit ne s'affichent que selon la valeur d'un autre réglage.
    if (key === "display.margin" || key === "extract.format" || key === "advanced") this.update();
  }

  private async setValue(key: string, value: unknown) {
    if (key === "advanced") {
      this.plugin.settings.advanced = value === true;
      return this.save();
    }
    const [section, field] = key.split(".") as [Section, string];
    (this.plugin.settings[section] as unknown as Record<string, unknown>)[field] = value;
    await this.save();
  }

  private marginContentOptions(): Record<string, string> {
    return { comment: t("marginComment"), thread: t("marginThread") };
  }

  private formatOptions(): Record<string, string> {
    return { list: t("formatList"), table: t("formatTable"), kanban: t("formatKanban") };
  }

  private existingOptions(): Record<string, string> {
    return { "append-new": t("existingAppend"), replace: t("existingReplace") };
  }

  /** Redessine les réglages après l'ajout ou la suppression d'une catégorie. */
  private refresh() {
    if (requireApiVersion("1.13.0")) this.update();
    else this.renderLegacy();
  }

  /** Rendu impératif, pour les versions d'Obsidian antérieures à 1.13. */
  display() {
    this.renderLegacy();
  }

  private renderLegacy() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("p", { cls: "setting-item-description" }).append(withLink(t("settingsIntro"), t("docMethod"), "method/categories"));

    this.plugin.settings.categories.forEach((cat, i) => {
      const setting = new Setting(containerEl);
      this.categoryRow(setting, cat);
      setting.addExtraButton((b) =>
        b.setIcon("trash-2").setTooltip(t("deleteCategory")).onClick(async () => {
          await this.deleteCategory(i);
          this.refresh();
        }),
      );
    });

    new Setting(containerEl).addButton((b) =>
      b.setButtonText(t("addCategory")).onClick(async () => {
        await this.addCategory();
        this.refresh();
      }),
    );

    const { display, extract } = this.plugin.settings;
    new Setting(containerEl).setName(t("settingsDisplay")).setHeading();
    new Setting(containerEl)
      .setName(t("settingsMargin"))
      .setDesc(withLink(t("settingsMarginDesc"), t("docMethod"), "method/margin"))
      .addToggle((c) => c.setValue(display.margin).onChange((v) => void this.setValue("display.margin", v)));
    new Setting(containerEl)
      .setName(t("settingsMarginContent"))
      .addDropdown((c) =>
        c.addOptions(this.marginContentOptions()).setValue(display.marginContent).onChange((v) => void this.setValue("display.marginContent", v)),
      );

    new Setting(containerEl).setName(t("settingsExtract")).setHeading();
    containerEl.createEl("p", { cls: "setting-item-description" }).append(withLink(t("settingsExtractDesc"), t("docMethod"), "method/periodic-review"));
    new Setting(containerEl)
      .setName(t("settingsExtractFormat"))
      .addDropdown((c) => c.addOptions(this.formatOptions()).setValue(extract.format).onChange((v) => void this.setValue("extract.format", v)));
    new Setting(containerEl)
      .setName(t("settingsExtractFolder"))
      .setDesc(t("settingsExtractFolderDesc"))
      .addText((c) => c.setValue(extract.folder).onChange((v) => void this.setValue("extract.folder", v.trim())));
    new Setting(containerEl)
      .setName(t("settingsExtractFileName"))
      .setDesc(t("settingsExtractFileNameDesc"))
      .addText((c) => c.setValue(extract.fileName).onChange((v) => void this.setValue("extract.fileName", v)));
    new Setting(containerEl)
      .setName(t("settingsExtractTemplate"))
      .setDesc(t("settingsExtractTemplateDesc"))
      .addTextArea((c) => c.setValue(extract.lineTemplate).onChange((v) => void this.setValue("extract.lineTemplate", v)));
    new Setting(containerEl)
      .setName(t("settingsExtractReplies"))
      .addToggle((c) => c.setValue(extract.includeReplies).onChange((v) => void this.setValue("extract.includeReplies", v)));
    new Setting(containerEl)
      .setName(t("settingsExtractExisting"))
      .addDropdown((c) =>
        c.addOptions(this.existingOptions()).setValue(extract.onExisting).onChange((v) => void this.setValue("extract.onExisting", v)),
      );
    new Setting(containerEl)
      .setName(t("settingsExtractMore"))
      .setDesc(t("settingsExtractMoreDesc"))
      .addButton((b) => b.setButtonText(t("settingsExtractMore")).onClick(() => new DefaultExtractionModal(this.app, this.plugin).open()));
    if (pluginEnabled(this.app, DATAVIEW)) new Setting(containerEl).setDesc(withLink(t("hintDataview"), t("hintLink"), "integrations/dataview"));

    const s = this.plugin.settings;
    new Setting(containerEl).setName(t("settingsGestes")).setHeading();
    containerEl.createEl("p", { cls: "setting-item-description" }).append(withLink(t("settingsGestesDesc"), t("docMethod"), "concepts/actions"));
    if (!s.actions.length) containerEl.createEl("p", { cls: "setting-item-description", text: t("settingsNoGeste") });
    s.actions.forEach((g, i) => this.gesteRow(new Setting(containerEl), g, i, true));
    new Setting(containerEl).addButton((b) => b.setButtonText(t("addGeste")).onClick(() => void this.addGeste()));
    if (pluginEnabled(this.app, QUICKADD)) new Setting(containerEl).setDesc(withLink(t("hintQuickAdd"), t("hintLink"), "integrations/quickadd"));

    new Setting(containerEl).setName(t("settingsGlobals")).setDesc(withLink(t("settingsGlobalsDesc"), t("docMethod"), "concepts/variables"));
    s.globals.forEach((v, i) => {
      const setting = new Setting(containerEl).setClass("ma-setting-indent");
      this.globalRow(setting, v);
      setting.addExtraButton((b) => b.setIcon("trash-2").setTooltip(t("deleteGlobal")).onClick(() => void this.deleteGlobal(i)));
    });
    new Setting(containerEl).addButton((b) => b.setButtonText(t("addGlobal")).onClick(() => void this.addGlobal()));

    new Setting(containerEl).setName(t("settingsAdvanced")).setHeading();
    new Setting(containerEl)
      .setName(t("settingsAdvanced"))
      .setDesc(withLink(t("settingsAdvancedDesc"), t("docMethod"), "advanced/scripts"))
      .addToggle((c) =>
        c.setValue(s.advanced).onChange(async (v) => {
          await this.setValue("advanced", v);
          this.refresh();
        }),
      );
    if (!s.advanced) return;
    new Setting(containerEl)
      .setName(t("settingsExport"))
      .setDesc(t("settingsExportDesc"))
      .addButton((b) => b.setButtonText(t("settingsExport")).onClick(() => void this.exportAll()));
    new Setting(containerEl)
      .setName(t("settingsImport"))
      .setDesc(t("settingsImportDesc"))
      .addButton((b) => b.setButtonText(t("importButton")).onClick(() => new ImportModal(this.app, this.plugin, () => this.refresh()).open()));
  }
}
