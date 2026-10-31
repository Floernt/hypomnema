import { App, PluginSettingTab, Setting } from "obsidian";
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

/** Classe CSS portant la couleur de la catégorie d'un tag ; chaîne vide si le tag n'est rattaché à aucune catégorie. */
export function categoryClass(categories: Category[], tag?: string): string {
  if (!tag) return "";
  const i = categories.findIndex((c) => c.tag === tag);
  return i < 0 ? "" : `ma-cat-${i}`;
}

/** Feuille de style des catégories : une classe par catégorie, qui fixe --ma-color. */
export function categoryCss(categories: Category[]): string {
  return categories
    .map((c, i) => (/^#[0-9a-fA-F]{3,8}$/.test(c.color) ? `.ma-cat-${i} { --ma-color: ${c.color}; }` : ""))
    .join("\n");
}

export class SettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: Hypomnema) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("p", { cls: "setting-item-description", text: t("settingsIntro") });

    const save = async () => {
      await this.plugin.saveSettings();
    };

    this.plugin.settings.categories.forEach((cat, i) => {
      new Setting(containerEl)
        .addText((c) => c.setPlaceholder(t("settingsName")).setValue(cat.name).onChange(async (v) => ((cat.name = v), await save())))
        .addColorPicker((c) => c.setValue(cat.color).onChange(async (v) => ((cat.color = v), await save())))
        .addText((c) =>
          c.setPlaceholder(t("settingsTag")).setValue(cat.tag).onChange(async (v) => ((cat.tag = normalizeTag(v)), await save())),
        )
        .addExtraButton((b) =>
          b.setIcon("trash-2").setTooltip(t("deleteCategory")).onClick(async () => {
            this.plugin.settings.categories.splice(i, 1);
            await save();
            this.display();
          }),
        )
        .setName(cat.name || t("newCategory"));
    });

    new Setting(containerEl).addButton((b) =>
      b.setButtonText(t("addCategory")).onClick(async () => {
        this.plugin.settings.categories.push({ name: "", color: "#3b82f6", tag: "" });
        await save();
        this.display();
      }),
    );
  }
}
