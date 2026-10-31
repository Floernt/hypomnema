import { App, PluginSettingTab, Setting } from "obsidian";
import type Hypomnema from "./main";

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

export const DEFAULT_SETTINGS: Settings = {
  categories: [{ name: "Idée", color: "#2e9e5b", tag: "idee" }],
  addedTags: {},
};

/** « #Droit privé » → « Droit-privé » : un tag Obsidian n'admet ni espace ni « # ». */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, "-");
}

export class SettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: Hypomnema) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text:
        "Chaque catégorie associe une couleur à un tag. Un commentaire classé dans une catégorie colore son passage " +
        "et ajoute le tag aux propriétés de la note ; le tag est retiré quand plus aucun commentaire de cette catégorie " +
        "n'y figure, sauf s'il était déjà présent avant.",
    });

    const save = async () => {
      await this.plugin.saveSettings();
    };

    this.plugin.settings.categories.forEach((cat, i) => {
      new Setting(containerEl)
        .addText((t) => t.setPlaceholder("Nom").setValue(cat.name).onChange(async (v) => ((cat.name = v), await save())))
        .addColorPicker((c) => c.setValue(cat.color).onChange(async (v) => ((cat.color = v), await save())))
        .addText((t) =>
          t.setPlaceholder("tag").setValue(cat.tag).onChange(async (v) => ((cat.tag = normalizeTag(v)), await save())),
        )
        .addExtraButton((b) =>
          b.setIcon("trash-2").setTooltip("Supprimer la catégorie").onClick(async () => {
            this.plugin.settings.categories.splice(i, 1);
            await save();
            this.display();
          }),
        )
        .setName(cat.name || "Nouvelle catégorie");
    });

    new Setting(containerEl).addButton((b) =>
      b.setButtonText("Ajouter une catégorie").onClick(async () => {
        this.plugin.settings.categories.push({ name: "", color: "#3b82f6", tag: "" });
        await save();
        this.display();
      }),
    );
  }
}
