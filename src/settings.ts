import { App, PluginSettingTab, requireApiVersion, Setting, SettingDefinitionItem } from "obsidian";
import type Hypomnema from "./main";
import { t } from "./i18n";

export interface Category {
  name: string;
  color: string;
  tag: string; // sans « # »
}

export interface Settings {
  categories: Category[];
  /** Tags ajoutés par le plugin, par chemin de note : seuls ceux-là peuvent être retirés automatiquement. */
  addedTags: Record<string, string[]>;
}

/** Réglages initiaux, avec une catégorie d'exemple dans la langue d'Obsidian. */
export function defaultSettings(): Settings {
  return {
    categories: [{ name: t("defaultCategoryName"), color: "#2e9e5b", tag: t("defaultCategoryTag") }],
    addedTags: {},
  };
}

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
    return [
      { name: t("settingsCategories"), desc: t("settingsIntro") },
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
    ];
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
    containerEl.createEl("p", { cls: "setting-item-description", text: t("settingsIntro") });

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
  }
}
