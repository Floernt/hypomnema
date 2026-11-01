import { debounce, MarkdownView, Plugin, TFile, TFolder, WorkspaceLeaf, WorkspaceSplit } from "obsidian";
import { Actions } from "./actions";
import { HypomnemaApi } from "./api";
import { GesteRunner } from "./runner";
import { allEditorViews, annotationExtension, refreshEffect } from "./editorExtension";
import { marginExtension } from "./margin";
import { categoryClass, categoryVars, mergeSettings, Settings, SettingsTab } from "./settings";
import { t } from "./i18n";
import { CommentsPanel, PANEL_VIEW } from "./sidePanel";
import type { ComposeRequest } from "./ui";

export default class Hypomnema extends Plugin {
  settings!: Settings;
  actions!: Actions;
  runner!: GesteRunner;
  /** API publique, pour les scripts : app.plugins.plugins.hypomnema.api. */
  api!: HypomnemaApi;
  async onload() {
    await this.loadSettings();
    // Couleurs des catégories : des variables CSS sur <body>, lues par les classes .ma-cat-i de styles.css.
    document.body.setCssProps(categoryVars(this.settings.categories));
    this.register(() => document.body.setCssProps(categoryVars([])));
    this.actions = new Actions(this);
    this.actions.compose = (view, req) => void this.compose(view, req);
    this.runner = new GesteRunner(this);
    this.api = new HypomnemaApi(this);

    this.registerView(PANEL_VIEW, (leaf) => new CommentsPanel(leaf, this));
    const classOf = (tag?: string) => categoryClass(this.settings.categories, tag);
    this.registerEditorExtension([
      annotationExtension((id) => void this.showThread(id), classOf),
      marginExtension({
        enabled: () => this.settings.display.margin,
        content: () => this.settings.display.marginContent,
        classOf,
        onOpen: (id) => void this.showThread(id),
      }),
    ]);
    this.addSettingTab(new SettingsTab(this.app, this));
    this.registerObsidianProtocolHandler("hypomnema", (params) => void this.actions.openLink(params));

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
    this.addCommand({
      id: "toggle-margin",
      name: t("cmdToggleMargin"),
      icon: "panel-right-dashed",
      callback: async () => {
        this.settings.display.margin = !this.settings.display.margin;
        await this.saveSettings();
      },
    });
    this.addCommand({
      id: "extract-note",
      name: t("cmdExtractNote"),
      icon: "list-checks",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) void this.actions.extractNote(file);
        return true;
      },
    });
    this.addCommand({
      id: "run-geste",
      name: t("cmdRunGeste"),
      icon: "wand",
      checkCallback: (checking) => {
        if (!this.settings.gestes.length) return false;
        if (!checking) void this.runner.choose();
        return true;
      },
    });
    this.runner.syncCommands();
    this.addRibbonIcon("message-square", t("ribbon"), () => this.openPanel());
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFolder)) return;
        menu.addItem((item) =>
          item
            .setTitle(t("menuExtractFolder"))
            .setIcon("list-checks")
            .onClick(() => void this.actions.extractFolder(file)),
        );
        // Extractions nommées proposées dans ce menu : elles portent alors sur le dossier cliqué.
        for (const g of this.settings.gestes) {
          if (g.kind !== "extraction" || !g.folderMenu) continue;
          menu.addItem((item) =>
            item
              .setTitle(g.name)
              .setIcon("list-checks")
              .onClick(() => void this.runner.run(g.id, { ctx: { folder: file } })),
          );
        }
      }),
    );

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
      this.dedupePanels();
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
    this.settings = mergeSettings((await this.loadData()) as Partial<Settings> | null);
  }

  /** Enregistre les réglages et rafraîchit couleurs et panneau dans les notes ouvertes. */
  async saveSettings() {
    await this.saveData(this.settings);
    this.runner.syncCommands();
    document.body.setCssProps(categoryVars(this.settings.categories));
    for (const view of allEditorViews()) view.dispatch({ effects: refreshEffect.of(null) });
    this.panels().forEach((p) => p.render());
  }

  private panels(): CommentsPanel[] {
    return this.app.workspace.getLeavesOfType(PANEL_VIEW).map((l) => l.view).filter((v): v is CommentsPanel => v instanceof CommentsPanel);
  }

  /**
   * Chaque rechargement du plugin (mise à jour, désactivation puis réactivation) peut laisser un onglet de plus,
   * qui n'apparaît parfois qu'après le chargement : on n'en garde qu'un, de préférence celui déjà affiché.
   */
  private dedupePanels(): WorkspaceLeaf | undefined {
    const leaves = this.app.workspace.getLeavesOfType(PANEL_VIEW);
    const keep = leaves.find((l) => l.view instanceof CommentsPanel) ?? leaves[0];
    for (const leaf of leaves) if (leaf !== keep) leaf.detach();
    return keep;
  }

  /** Crée l'onglet du panneau dans la barre de droite, à côté des rétroliens, liens sortants et plan. */
  private async ensurePanel(): Promise<WorkspaceLeaf | null> {
    const ws = this.app.workspace;
    const existing = this.dedupePanels();
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
