import { App, FuzzySuggestModal, Modal, Setting } from "obsidian";
import { t } from "./i18n";

/** Demande une valeur ({{VALUE:libellé}}) ; null si l'utilisateur renonce. */
export function promptValue(app: App, label: string): Promise<string | null> {
  return new Promise((resolve) => {
    let value = "";
    let done = false;
    const modal = new Modal(app);
    const finish = (v: string | null) => {
      if (done) return;
      done = true;
      resolve(v);
      modal.close();
    };
    modal.titleEl.setText(label);
    new Setting(modal.contentEl).addText((c) => {
      c.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(value);
        }
      });
      c.onChange((v) => (value = v));
      window.setTimeout(() => c.inputEl.focus(), 0);
    });
    new Setting(modal.contentEl)
      .addButton((b) => b.setButtonText(t("cancel")).onClick(() => finish(null)))
      .addButton((b) => b.setButtonText(t("promptOk")).setCta().onClick(() => finish(value)));
    modal.onClose = () => finish(null);
    modal.open();
  });
}

class Picker<T> extends FuzzySuggestModal<T> {
  private chosen = false;
  constructor(app: App, private items: T[], private label: (item: T) => string, placeholder: string, private resolve: (v: T | null) => void) {
    super(app);
    this.setPlaceholder(placeholder);
  }
  getItems() {
    return this.items;
  }
  getItemText(item: T) {
    return this.label(item);
  }
  onChooseItem(item: T) {
    this.chosen = true;
    this.resolve(item);
  }
  onClose() {
    // onChooseItem est appelé après onClose : on laisse passer le choix avant de conclure à un abandon.
    window.setTimeout(() => !this.chosen && this.resolve(null), 0);
  }
}

/** Liste à filtrer au clavier ; null si l'utilisateur renonce. */
export function pick<T>(app: App, items: T[], label: (item: T) => string, placeholder: string): Promise<T | null> {
  return new Promise((resolve) => new Picker(app, items, label, placeholder, resolve).open());
}
