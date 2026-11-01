// Captures des actions (réglages, formulaire, annotation préremplie), dans le vrai Obsidian, sur demo-vault/
// Même préparation que scripts/capture.mjs (instance séparée d'Obsidian, port 9333), puis :
//   node scripts/capture-actions.mjs [en|fr ...] [--dark|--light]   (sans option : tout)
// Les réglages s'ouvrent dans une fenêtre à part : elle est capturée par Electron (capturePage).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect, look, parseArgs, shotName, sleep, ZOOM } from "./cdp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "screenshots");

const LANGS = {
  en: {
    note: "Why we forget what we read.md",
    word: "Ebbinghaus",
    categories: [
      { name: "Idea", color: "#2e9e5b", tag: "idea" },
      { name: "Question", color: "#3b82f6", tag: "question" },
      { name: "To verify", color: "#e8833a", tag: "to-verify" },
      { name: "Quote", color: "#a855f7", tag: "quote" },
    ],
    globals: [{ name: "reader", value: "F. E." }],
    gestes: [
      { id: "objection", name: "Objection", kind: "annotation", command: true, category: "question", initialText: "Objection: {{cursor}}" },
      { id: "verify", name: "To verify", kind: "annotation", command: true, category: "to-verify", initialText: "Check {{VALUE:what?}} — source: {{cursor}}" },
      {
        id: "weekly", name: "Weekly review", kind: "extraction", command: true, scope: "folder-current", folderPath: "", folderMenu: true,
        categories: ["question", "to-verify"], since: "{{date-7d}}", includeReplies: true, format: "kanban", folder: "Reviews",
        fileName: "Review {{date:YYYY-[W]WW}}", lineTemplate: "{{text}} — “{{quote}}” {{link}}", template: "", templater: false, onExisting: "append-new",
      },
    ],
    headings: "Actions",
  },
  fr: {
    note: "Pourquoi on oublie ce qu'on lit.md",
    word: "Ebbinghaus",
    categories: [
      { name: "Idée", color: "#2e9e5b", tag: "idee" },
      { name: "Question", color: "#3b82f6", tag: "question" },
      { name: "À vérifier", color: "#e8833a", tag: "a-verifier" },
      { name: "Citation", color: "#a855f7", tag: "citation" },
    ],
    globals: [{ name: "lecteur", value: "F. E." }],
    gestes: [
      { id: "objection", name: "Objection", kind: "annotation", command: true, category: "question", initialText: "Objection : {{cursor}}" },
      { id: "verifier", name: "À vérifier", kind: "annotation", command: true, category: "a-verifier", initialText: "Vérifier {{VALUE:quoi ?}} — source : {{cursor}}" },
      {
        id: "revue", name: "Revue de la semaine", kind: "extraction", command: true, scope: "folder-current", folderPath: "", folderMenu: true,
        categories: ["question", "a-verifier"], since: "{{date-7d}}", includeReplies: true, format: "kanban", folder: "Revues",
        fileName: "Revue {{date:YYYY-[S]WW}}", lineTemplate: "{{text}} — « {{quote}} » {{link}}", template: "", templater: false, onExisting: "append-new",
      },
    ],
    headings: "Actions",
  },
};

let c = await connect();

/** Capture de la fenêtre des réglages (fenêtre à part) ou de la fenêtre principale. */
async function shot(name, settingsWindow = false) {
  const file = path.join(OUT, name).replace(/\\/g, "/");
  await c.move(26, 700); // pointeur hors de tout élément survolable
  if (!settingsWindow) {
    await c.eval(`document.querySelectorAll(".notice").forEach((n) => n.remove());`);
    fs.writeFileSync(file, await c.screenshot());
  } else {
    await c.eval(`
      const { BrowserWindow } = require("electron").remote;
      const w = BrowserWindow.getAllWindows().find((x) => x.getTitle() !== document.title);
      w.setContentSize(1100, 760);
      w.webContents.setZoomFactor(${ZOOM});
      await new Promise((r) => setTimeout(r, 400));
      require("fs").writeFileSync(${JSON.stringify(file)}, (await w.webContents.capturePage()).toPNG());
      return true;`);
  }
  console.log("OK", name);
}

const { langs, themes } = parseArgs();
for (const theme of themes) for (const lang of langs) {
  const L = LANGS[lang];
  const current = await c.eval(`return localStorage.getItem("language") || "en";`);
  if (current !== lang) {
    await c.eval(`localStorage.setItem("language", ${JSON.stringify(lang)}); setTimeout(() => location.reload(), 50); return true;`);
    c.close();
    await sleep(15000);
    c = await connect();
    // Attendre le chargement du plugin.
    for (let i = 0; i < 30 && !(await c.eval(`return !!app.plugins?.plugins?.hypomnema;`)); i++) await sleep(1000);
  }
  await look(c, theme);
  await c.eval(`
    app.workspace.leftSplit.collapse();
    const p = app.plugins.plugins.hypomnema;
    p.settings.categories = ${JSON.stringify(L.categories)};
    p.settings.globals = ${JSON.stringify(L.globals)};
    p.settings.actions = ${JSON.stringify(L.gestes)};
    p.settings.display.margin = false;
    await p.saveSettings();
    for (const type of ["markdown", "kanban", "empty"]) app.workspace.getLeavesOfType(type).forEach((l) => l.detach());
    return true;`);
  await sleep(800);

  // 12 : la section Gestes des réglages.
  await c.eval(`
    let el = null;
    // Juste après un rechargement, la fenêtre des réglages peut mettre un moment à s'ouvrir.
    for (let i = 0; i < 20 && !el; i++) {
      app.setting.open(); app.setting.openTabById("hypomnema");
      await new Promise((r) => setTimeout(r, 600));
      el = app.setting.modalEl?.querySelector(".vertical-tab-content");
    }
    // Les gestes viennent d'être posés par script : on redessine l'onglet.
    app.setting.pluginTabs.find((t) => t.id === "hypomnema")?.update?.();
    await new Promise((r) => setTimeout(r, 600));
    [...el.querySelectorAll(".setting-item-heading")].find((x) => x.textContent === ${JSON.stringify(L.headings)})?.scrollIntoView();
    return true;`);
  await sleep(600);
  await shot(shotName("12-actions-settings", lang, theme), true);

  // 13 : le formulaire d'une extraction nommée, options dépliées.
  await c.eval(`
    const el = app.setting.modalEl.querySelector(".vertical-tab-content");
    const row = [...el.querySelectorAll(".setting-item")].find((x) => x.querySelector(".setting-item-name")?.textContent === ${JSON.stringify(L.gestes[2].name)});
    row.querySelector(".clickable-icon").click();
    await new Promise((r) => setTimeout(r, 600));
    const doc = app.setting.modalEl.ownerDocument;
    const d = doc.querySelector(".ma-geste-modal details"); d.open = true;
    doc.querySelector(".ma-geste-modal").closest(".modal").querySelector(".modal-content").scrollTop = 260;
    return true;`);
  await sleep(500);
  await shot(shotName("13-action-extraction", lang, theme), true);
  await c.eval(`app.setting.modalEl.ownerDocument.querySelector(".ma-geste-modal")?.closest(".modal-container")?.remove(); app.setting.close(); return true;`);
  await sleep(800);

  // 14 : une annotation préremplie par le geste « Objection ».
  await c.eval(`
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(app.vault.getAbstractFileByPath(${JSON.stringify(L.note)}), { state: { mode: "source", source: false } });
    app.workspace.setActiveLeaf(leaf, { focus: true });
    await new Promise((r) => setTimeout(r, 800));
    const ed = leaf.view.editor;
    const i = ed.getValue().indexOf(${JSON.stringify(L.word)});
    ed.setSelection(ed.offsetToPos(i), ed.offsetToPos(i + ${L.word.length}));
    app.commands.executeCommandById("hypomnema:action-objection");
    await new Promise((r) => setTimeout(r, 1200));
    document.querySelector(".ma-composer textarea")?.focus();
    return true;`);
  await sleep(500);
  await shot(shotName("14-action-annotation", lang, theme));
  // Annule le brouillon : les marqueurs posés sont retirés.
  await c.eval(`document.querySelector(".ma-composer-bar button:not(.mod-cta)")?.click(); return true;`);
  await sleep(600);
  await c.eval(`const p = app.plugins.plugins.hypomnema; p.settings.actions = []; p.settings.globals = []; await p.saveSettings(); return true;`);
}
c.close();
