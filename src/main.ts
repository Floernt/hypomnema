import { debounce, MarkdownView, Plugin, TFile, WorkspaceLeaf, WorkspaceSplit } from "obsidian";
import { Actions } from "./actions";
import { allEditorViews, annotationExtension, refreshEffect } from "./editorExtension";
import { categoryClass, categoryCss, defaultSettings, Settings, SettingsTab } from "./settings";
import { t } from "./i18n";
import { CommentsPanel, PANEL_VIEW } from "./sidePanel";
import type { ComposeRequest } from "./ui";

export default class Hypomnema extends Plugin {
  settings!: Settings;
  actions!: Actions;
  private categoryStyle!: HTMLStyleElement;

  async onload() {
    await this.loadSettings();
    // Couleurs des catégories : une feuille de style gérée par le plugin plutôt que des styles en ligne.
    this.categoryStyle = document.head.createEl("style", { attr: { id: "hypomnema-categories" } });
    this.register(() => this.categoryStyle.remove());
    this.categoryStyle.textContent = categoryCss(this.settings.categories);
    this.actions = new Actions(this);
    this.actions.compose = (view, req) => void this.compose(view, req);

    this.registerView(PANEL_VIEW, (leaf) => new CommentsPanel(leaf, this));
    this.registerEditorExtension(annotationExtension((id) => this.showThread(id), (tag) => categoryClass(this.settings.categories, tag)));
    this.addSettingTab(new SettingsTab(this.app, this));

    this.addCommand({
      id: "comment-selection",
      name: t("cmdComment"),
      icon: "message-square-plus",
      editorCheckCallback: (checking, _editor, ctx) => {
        if (!(ctx instanceof MarkdownView)) return false;
        if (!checking) this.actions.startDraft(ctx);
        return true;
      },
    });
    this.addCommand({
      id: "open-panel",
      name: t("cmdOpenPanel"),
      callback: () => this.openPanel(),
    });
    this.addRibbonIcon("message-square", t("ribbon"), () => this.openPanel());

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, ctx) => {
        if (!(ctx instanceof MarkdownView)) return;
        menu.addItem((item) =>
          item
            .setTitle(editor.somethingSelected() ? t("menuSelection") : t("menuHere"))
            .setIcon("message-square-plus")
            .setSection("selection")
            .onClick(() => this.actions.startDraft(ctx)),
        );
      }),
    );

    const refresh = debounce(() => this.panels().forEach((p) => p.render()), 300, true);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view instanceof MarkdownView) this.panels().forEach((p) => p.setTarget(leaf.view as MarkdownView));
      }),
    );
    // Ouvrir une autre note dans le même onglet ne change pas la feuille active. Si le panneau a le focus
    // (rédaction en cours), seul « layout-change » est émis : chaque panneau revérifie alors la note qu'il suit.
    const follow = () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      this.panels().forEach((p) => p.follow(view));
    };
    this.registerEvent(this.app.workspace.on("file-open", follow));
    this.registerEvent(this.app.workspace.on("layout-change", follow));
    this.registerEvent(this.app.workspace.on("editor-change", refresh));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof TFile) void this.actions.onRename(file, oldPath);
      }),
    );

    this.app.workspace.onLayoutReady(async () => {
      await this.ensurePanel();
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      this.panels().forEach((p) => p.setTarget(view));
    });
  }

  async loadSettings() {
    const data = (await this.loadData()) as Partial<Settings> | null;
    this.settings = {
      categories: data?.categories ?? defaultSettings().categories,
      addedTags: data?.addedTags ?? {},
    };
  }

  /** Enregistre les réglages et rafraîchit couleurs et panneau dans les notes ouvertes. */
  async saveSettings() {
    await this.saveData(this.settings);
    this.categoryStyle.textContent = categoryCss(this.settings.categories);
    for (const view of allEditorViews()) view.dispatch({ effects: refreshEffect.of(null) });
    this.panels().forEach((p) => p.render());
  }

  private panels(): CommentsPanel[] {
    return this.app.workspace.getLeavesOfType(PANEL_VIEW).map((l) => l.view).filter((v): v is CommentsPanel => v instanceof CommentsPanel);
  }

  /** Crée l'onglet du panneau dans la barre de droite, à côté des rétroliens, liens sortants et plan. */
  private async ensurePanel(): Promise<WorkspaceLeaf | null> {
    const ws = this.app.workspace;
    const existing = ws.getLeavesOfType(PANEL_VIEW)[0];
    if (existing) return existing;
    const sibling = ["backlink", "outgoing-link", "outline"]
      .map((type) => ws.getLeavesOfType(type)[0])
      .find((l) => l && l.getRoot() === ws.rightSplit);
    let leaf: WorkspaceLeaf | null;
    if (sibling) {
      const tabs = sibling.parent as unknown as WorkspaceSplit & { children?: unknown[] };
      leaf = ws.createLeafInParent(tabs, tabs.children?.length ?? 0);
    } else {
      leaf = ws.getRightLeaf(false);
    }
    await leaf?.setViewState({ type: PANEL_VIEW, active: false });
    return leaf;
  }

  /** Affiche le panneau et renvoie sa vue, chargée (un onglet masqué n'est chargé qu'à son affichage). */
  private async revealPanel(): Promise<CommentsPanel | null> {
    const leaf = await this.ensurePanel();
    if (!leaf) return null;
    await this.app.workspace.revealLeaf(leaf);
    return leaf.view instanceof CommentsPanel ? leaf.view : null;
  }

  private async compose(view: MarkdownView, req: ComposeRequest) {
    (await this.revealPanel())?.compose(view, req);
  }

  /** Ouvre le panneau sur le fil du passage cliqué, sans retirer le focus de la note. */
  private async showThread(id: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    (await this.revealPanel())?.focusThread(view, id);
  }

  private async openPanel() {
    const panel = await this.revealPanel();
    const recent = this.app.workspace.getMostRecentLeaf()?.view;
    panel?.setTarget(recent instanceof MarkdownView ? recent : null);
  }
}
