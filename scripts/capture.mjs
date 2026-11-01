// Captures d'écran et GIF de la visite, dans le vrai Obsidian, sur demo-vault/.
//
// 1. npm run build, puis copier main.js, manifest.json et styles.css dans demo-vault/.obsidian/plugins/hypomnema/
//    (installer aussi les plugins Kanban et Dataview dans ce coffre pour les captures 10 et 11).
// 2. Lancer une instance séparée d'Obsidian sur demo-vault, sans toucher à la vôtre :
//      "C:\Program Files\Obsidian\Obsidian.exe" --user-data-dir=<dossier vide> --remote-debugging-port=9333
//    (le dossier contient un obsidian.json qui déclare demo-vault ouvert ; accepter une fois « Trust author »).
// 3. node scripts/capture.mjs [en|fr ...] [--dark|--light] [--tour]
//    --tour : seulement les captures 01 à 06 de la visite.
//    Sans option : les deux langues, dans les deux thèmes. Les PNG vont dans docs/screenshots/ ; les images des GIF
//    dans un dossier temporaire, assemblées par scripts/frames-to-gif.py (Python + Pillow).
//    La note de démonstration est remise dans son état d'origine après chaque scène qui la modifie.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { connect, look, parseArgs, shotName, sleep, ZOOM } from "./cdp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "screenshots");

const LANGS = {
  en: {
    note: "Why we forget what we read.md",
    dashboard: "Reading dashboard.md",
    categories: [
      { name: "Idea", color: "#2e9e5b", tag: "idea" },
      { name: "Question", color: "#3b82f6", tag: "question" },
      { name: "To verify", color: "#e8833a", tag: "to-verify" },
      { name: "Quote", color: "#a855f7", tag: "quote" },
    ],
    fileName: "{{note}} — comments",
    lineTemplate: "{{text}} — “{{quote}}” {{link}}",
    marginQuery: "comments in the margin",
    extractQuery: "extract comments from this",
    passage: "Retention requires the reader to do something with what they read.",
    comment: "Worth quoting in my note on active reading: retention is an action, not a state.",
    pointComment: "Does a comment placed",
    search: "Diophantus",
    menuSelection: "Comment on selection",
  },
  fr: {
    note: "Pourquoi on oublie ce qu'on lit.md",
    dashboard: "Tableau de bord de lecture.md",
    categories: [
      { name: "Idée", color: "#2e9e5b", tag: "idee" },
      { name: "Question", color: "#3b82f6", tag: "question" },
      { name: "À vérifier", color: "#e8833a", tag: "a-verifier" },
      { name: "Citation", color: "#a855f7", tag: "citation" },
    ],
    fileName: "{{note}} — commentaires",
    lineTemplate: "{{text}} — « {{quote}} » {{link}}",
    marginQuery: "commentaires en marge",
    extractQuery: "extraire les commentaires de cette",
    passage: "Retenir exige que le lecteur fasse quelque chose de ce qu'il lit.",
    comment: "À citer dans ma note sur la lecture active : retenir est une action, pas un état.",
    pointComment: "Un commentaire posé",
    search: "Diophante",
    menuSelection: "Commenter la sélection",
  },
};

let c = await connect();
const wait = (ms = 600) => sleep(ms);

/** Pointeur dans une zone neutre (le ruban de gauche) : sinon un élément survolé reste mis en évidence. */
const park = () => c.move(26, 700);

async function shot(name) {
  await park();
  await c.eval(`document.querySelectorAll(".notice").forEach((n) => n.remove());`);
  fs.writeFileSync(path.join(OUT, name), await c.screenshot());
  console.log("✓", name);
}

/** Les réglages s'ouvrent parfois dans une fenêtre à part : on la capture alors par Electron, au même zoom. */
async function shotSettings(name) {
  const file = path.join(OUT, name).replace(/\\/g, "/");
  await park();
  const separate = await c.eval(`
    const { BrowserWindow } = require("electron").remote;
    const w = BrowserWindow.getAllWindows().find((x) => x.isVisible() && x.getTitle() !== document.title && x.getTitle().startsWith("Settings"));
    if (!w) return false;
    w.setContentSize(1100, 760);
    w.webContents.setZoomFactor(${ZOOM});
    await new Promise((r) => setTimeout(r, 400));
    require("fs").writeFileSync(${JSON.stringify(file)}, (await w.webContents.capturePage()).toPNG());
    return true;`);
  if (separate) console.log("✓", name);
  else await shot(name);
}

// --- GIF : images successives, chacune avec sa durée ---

let frames = null;
async function frame(ms = 120) {
  const file = path.join(frames.dir, `${String(frames.list.length).padStart(4, "0")}.png`);
  fs.writeFileSync(file, await c.screenshot());
  frames.list.push({ file: path.basename(file), ms });
}
function startGif() {
  frames = { dir: fs.mkdtempSync(path.join(os.tmpdir(), "hypomnema-gif-")), list: [] };
}
function endGif(name) {
  fs.writeFileSync(path.join(frames.dir, "frames.json"), JSON.stringify(frames.list));
  execFileSync("python", [path.join(ROOT, "scripts", "frames-to-gif.py"), frames.dir, path.join(OUT, name)], { stdio: "inherit" });
  fs.rmSync(frames.dir, { recursive: true });
  frames = null;
}

// Curseur dessiné dans la page : les captures CDP ne montrent pas celui du système.
let cursor = { x: 640, y: 400 };
async function showCursor() {
  await c.eval(`
    let el = document.getElementById("cap-cursor");
    if (!el) {
      el = document.createElement("div");
      el.id = "cap-cursor";
      el.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      Object.assign(el.style, { position: "fixed", zIndex: 99999, pointerEvents: "none", left: "0px", top: "0px" });
      document.body.appendChild(el);
    }
    el.style.display = "block";`);
  await moveTo(cursor.x, cursor.y, 1);
}
async function hideCursor() {
  await c.eval(`document.getElementById("cap-cursor")?.remove();`);
}
async function moveTo(x, y, steps = 6) {
  const from = { ...cursor };
  for (let i = 1; i <= steps; i++) {
    const p = { x: from.x + ((x - from.x) * i) / steps, y: from.y + ((y - from.y) * i) / steps };
    await c.eval(`const el = document.getElementById("cap-cursor"); el.style.left = "${p.x}px"; el.style.top = "${p.y}px";`);
    await c.move(p.x, p.y);
    if (frames) await frame(40);
  }
  cursor = { x, y };
}
async function centerOf(selector) {
  return c.eval(`const r = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect(); return r && { x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2 };`);
}
/** Centre du premier élément `selector` dont le texte vaut `text`. */
async function centerOfText(selector, text) {
  return c.eval(`
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((x) => x.textContent.trim() === ${JSON.stringify(text)});
    const r = el?.getBoundingClientRect(); return r && { x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2 };`);
}
async function typeSlowly(text, ms = 60) {
  for (const ch of text) {
    await c.type(ch);
    if (frames) await frame(ms);
  }
}
async function press(key, modifiers = 0) {
  const code = { Enter: 13, Escape: 27 }[key];
  await c.send("Input.dispatchKeyEvent", { type: modifiers ? "rawKeyDown" : "keyDown", key, code: key, windowsVirtualKeyCode: code, modifiers });
  await c.send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: code, modifiers });
}
async function rightClick(x, y) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await c.send("Input.dispatchMouseEvent", { type, x, y, button: "right", clickCount: 1 });
  }
}

// --- Mise en place d'une langue et d'un thème ---

async function setup(lang, theme) {
  const L = LANGS[lang];
  const current = await c.eval(`return localStorage.getItem("language") || "en";`);
  if (current !== lang) {
    await c.eval(`localStorage.setItem("language", ${JSON.stringify(lang)}); setTimeout(() => location.reload(), 50); return true;`);
    // Le rechargement détruit la page : on se reconnecte, puis on attend le plugin.
    c.close();
    await sleep(15000);
    c = await connect();
    for (let i = 0; i < 30 && !(await c.eval(`return !!app.plugins?.plugins?.hypomnema;`)); i++) await sleep(1000);
  }
  await look(c, theme);
  await c.eval(`
    if (!app.plugins.isEnabled()) await app.plugins.setEnable(true);
    await app.plugins.loadManifests();
    for (const id of ["hypomnema", "obsidian-kanban", "dataview"]) await app.plugins.enablePlugin(id);
    // Repartir d'un espace de travail propre : pas de fenêtre ouverte, un seul onglet.
    document.querySelectorAll(".modal-container").forEach((m) => m.remove());
    app.setting.close();
    for (const type of ["markdown", "kanban", "empty"]) app.workspace.getLeavesOfType(type).forEach((l) => l.detach());
    const dv = app.plugins.plugins.dataview;
    if (dv && !dv.settings.enableDataviewJs) { dv.settings.enableDataviewJs = true; await dv.saveData(dv.settings); await app.plugins.disablePlugin("dataview"); await app.plugins.enablePlugin("dataview"); }
    const p = app.plugins.plugins.hypomnema;
    p.settings.categories = ${JSON.stringify(L.categories)};
    p.settings.display = { margin: false, marginContent: "comment" };
    Object.assign(p.settings.extract, {
      folder: "Extractions", format: "kanban", onExisting: "append-new", includeReplies: true,
      fileName: ${JSON.stringify(L.fileName)}, lineTemplate: ${JSON.stringify(L.lineTemplate)},
    });
    await p.saveSettings();
    // Repartir d'un coffre propre : pas d'extraction antérieure.
    const old = app.vault.getAbstractFileByPath("Extractions");
    if (old) await app.vault.delete(old, true);
    app.workspace.leftSplit.collapse();
    app.workspace.rightSplit.collapse();
    await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(${JSON.stringify(L.note)}), { state: { mode: "source", source: false } });
    window.__capOriginal = await app.vault.read(app.vault.getAbstractFileByPath(${JSON.stringify(L.note)}));
    return true;`);
  await wait(1200);
}

/** Remet la note de démonstration dans son état d'origine et ferme ce qui a été ouvert. */
async function restore(lang) {
  await c.eval(`
    document.querySelector(".ma-composer-bar button:not(.mod-cta)")?.click();
    document.querySelectorAll(".menu").forEach((m) => m.remove());
    const f = app.vault.getAbstractFileByPath(${JSON.stringify(LANGS[lang].note)});
    if ((await app.vault.read(f)) !== window.__capOriginal) await app.vault.modify(f, window.__capOriginal);
    return true;`);
  await wait(800);
}

async function scroll(y) {
  await c.eval(`app.workspace.activeEditor?.editor?.scrollTo(0, ${y});`);
  await wait(700);
}

/** Fait défiler l'éditeur pour amener `text` au milieu de la hauteur (par CodeMirror, qui connaît la mise en page). */
async function scrollToText(text) {
  await c.eval(`
    const cm = app.workspace.activeEditor.editor.cm;
    const i = cm.state.doc.toString().indexOf(${JSON.stringify(text)});
    cm.dispatch({ effects: cm.constructor.scrollIntoView(i, { y: "center" }) });`);
  await wait(700);
}

/** Coordonnées à l'écran d'une position (décalage) du texte de la note active. */
async function coordsAt(offset) {
  return c.eval(`const r = app.workspace.activeEditor.editor.cm.coordsAtPos(${offset}); return r && { x: r.left, y: (r.top + r.bottom) / 2 };`);
}

/** La marge a besoin de place à côté du texte : ses scènes passent à un zoom un peu plus faible. */
async function zoom(z) {
  await c.eval(`require("electron").webFrame.setZoomFactor(${z});`);
  await wait(500);
}

async function setMargin(on) {
  await c.eval(`const p = app.plugins.plugins.hypomnema; p.settings.display.margin = ${on}; await p.saveSettings();`);
  await wait(700);
}

async function openPanel() {
  await c.eval(`app.commands.executeCommandById("hypomnema:open-panel");`);
  await wait(900);
}

// --- Scènes ---

/** GIF de la page d'accueil : sélectionner un passage, clic droit, le commenter dans une catégorie, Ctrl+Entrée. */
async function heroGif(lang, theme) {
  const L = LANGS[lang];
  await openPanel();
  await scrollToText(L.passage);
  const start = await c.eval(`return app.workspace.activeEditor.editor.getValue().indexOf(${JSON.stringify(L.passage)});`);
  const end = start + L.passage.length;
  startGif();
  cursor = { x: 700, y: 560 };
  await showCursor();
  await frame(900);
  const a = await coordsAt(start);
  await moveTo(a.x, a.y, 10);
  await frame(300);
  // Sélection « à la souris » : elle s'étend pas à pas jusqu'à la fin du passage.
  for (let k = 1; k <= 10; k++) {
    const off = Math.round(start + ((end - start) * k) / 10);
    await c.eval(`const ed = app.workspace.activeEditor.editor; ed.setSelection(ed.offsetToPos(${start}), ed.offsetToPos(${off}));`);
    const p = await coordsAt(off);
    await moveTo(p.x, p.y, 1);
  }
  await frame(600);
  await rightClick(cursor.x, cursor.y);
  await wait(500);
  await frame(900);
  const item = await centerOfText(".menu-item-title", L.menuSelection);
  if (item) {
    await moveTo(item.x, item.y, 8);
    await frame(500);
    await c.click(item.x, item.y);
  }
  await wait(1200);
  await frame(700);
  const chip = await centerOfText(".ma-composer .ma-chip", L.categories[3].name);
  if (chip) {
    await moveTo(chip.x, chip.y, 10);
    await frame(400);
    await c.click(chip.x, chip.y);
    await wait(300);
    await frame(500);
  }
  const area = await centerOf(".ma-composer textarea");
  if (area) await moveTo(area.x, area.y, 6);
  await typeSlowly(L.comment, 45);
  await frame(900);
  await press("Enter", 2); // Ctrl+Entrée enregistre
  await wait(1200);
  await frame(3500);
  await hideCursor();
  endGif(shotName("00-hero", lang, theme, "gif"));
  await restore(lang);
}

/** Captures de la visite : vue d'ensemble, rédaction, tags, commentaire au point, recherche, réglages. */
async function tour(lang, theme) {
  const L = LANGS[lang];
  await openPanel();

  // 01 : vue d'ensemble, note et panneau. Curseur au début : la scène précédente a pu laisser une sélection.
  await c.eval(`app.workspace.activeEditor.editor.setCursor({ line: 0, ch: 0 });`);
  await scroll(0);
  await shot(shotName("01-overview", lang, theme));

  // 02 : rédaction d'un commentaire classé, dans le panneau.
  await scrollToText(L.passage);
  await c.eval(`
    const view = app.workspace.activeEditor;
    const ed = view.editor; const i = ed.getValue().indexOf(${JSON.stringify(L.passage)});
    ed.setSelection(ed.offsetToPos(i), ed.offsetToPos(i + ${L.passage.length}));
    app.commands.executeCommandById("hypomnema:comment-selection");`);
  await wait(1200);
  const chip = await centerOfText(".ma-composer .ma-chip", L.categories[3].name);
  if (chip) await c.click(chip.x, chip.y);
  await c.eval(`document.querySelector(".ma-composer textarea")?.focus();`);
  await c.type(L.comment);
  await wait(500);
  await shot(shotName("02-compose", lang, theme));

  // 03 : enregistré, le tag de la catégorie rejoint les propriétés de la note.
  await press("Enter", 2);
  await wait(1200);
  await scroll(0);
  await shot(shotName("03-auto-tags", lang, theme));
  await restore(lang);

  // 04 : un commentaire posé à un point précis, son fil ouvert dans le panneau.
  await c.eval(`
    const p = app.plugins.plugins.hypomnema;
    const f = app.workspace.getActiveFile();
    const th = (await p.api.threads(f)).find((t) => t.root.text.startsWith(${JSON.stringify(L.pointComment)}));
    const panel = app.workspace.getLeavesOfType("hypomnema-panel")[0]?.view;
    const view = app.workspace.activeEditor;
    if (th && panel) { p.actions.reveal(view, th); panel.focusThread(view, th.id); }`);
  await wait(1500);
  await shot(shotName("04-point-comment", lang, theme));

  // 05 : les commentaires sont du texte : la recherche d'Obsidian les trouve.
  await c.eval(`
    app.workspace.leftSplit.expand();
    app.internalPlugins.getPluginById("global-search").instance.openGlobalSearch(${JSON.stringify(L.search)});`);
  await wait(1500);
  await shot(shotName("05-search", lang, theme));
  await c.eval(`app.workspace.leftSplit.collapse();`);

  // 06 : les catégories, dans les réglages.
  await c.eval(`app.setting.open(); app.setting.openTabById("hypomnema");`);
  await wait(900);
  await shotSettings(shotName("06-settings", lang, theme));
  await c.eval(`app.setting.close();`);
  await wait(500);
  await c.eval(`app.workspace.rightSplit.collapse();`);
}

async function scenes(lang, theme) {
  const L = LANGS[lang];
  await setup(lang, theme);
  if (process.argv.includes("--tour")) return tour(lang, theme);
  await heroGif(lang, theme);
  await tour(lang, theme);

  // 07 : commentaires en marge
  await zoom(1.05);
  await setMargin(true);
  await scroll(560);
  await shot(shotName("07-margin", lang, theme));

  // 08 : panneau étroit, les commentaires passent sous le paragraphe
  await c.eval(`app.workspace.rightSplit.expand();`);
  await wait(1200);
  await scroll(560);
  await shot(shotName("08-margin-narrow", lang, theme));
  await c.eval(`app.workspace.rightSplit.collapse();`);
  await setMargin(false);
  await zoom(ZOOM);

  // 09 : réglages de l'extraction
  await c.eval(`
    app.setting.open(); app.setting.openTabById("hypomnema");
    await new Promise((r) => setTimeout(r, 500));
    const doc = app.setting.modalEl?.ownerDocument ?? document;
    const h = [...doc.querySelectorAll(".vertical-tab-content .setting-item-heading")].pop();
    h?.scrollIntoView({ block: "start" });`);
  await wait(600);
  await shotSettings(shotName("09-extract-settings", lang, theme));
  await c.eval(`app.setting.close();`);
  await wait(400);

  // 10 : extraction en tableau Kanban
  await c.eval(`app.commands.executeCommandById("hypomnema:extract-note");`);
  await wait(2500);
  await shot(shotName("10-extract-kanban", lang, theme));

  // 11 : tableau de bord Dataview
  await c.eval(`await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(${JSON.stringify(L.dashboard)}), { state: { mode: "preview" } });`);
  await wait(2500);
  await shot(shotName("11-dataview-dashboard", lang, theme));

  // GIF 1 : la marge s'active depuis la palette, puis le panneau la fait passer sous le paragraphe.
  await c.eval(`
    const d = app.vault.getAbstractFileByPath("Extractions"); if (d) await app.vault.delete(d, true);
    await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(${JSON.stringify(L.note)}), { state: { mode: "source", source: false } });`);
  await wait(1000);
  await zoom(1.05);
  await scroll(560);
  startGif();
  await showCursor();
  await frame(1200);
  await c.eval(`app.commands.executeCommandById("command-palette:open");`);
  await wait(300);
  await frame(400);
  await typeSlowly(L.marginQuery);
  await frame(600);
  await press("Enter");
  await wait(800);
  await frame(1800);
  const note = await centerOf(".ma-margin-note[data-ma-id='a3']");
  if (note) {
    await moveTo(note.x, note.y, 10);
    await wait(200);
    await frame(1400);
    // Clic sur la note : le panneau s'ouvre sur le fil, la marge se replie sous le paragraphe.
    await c.click(note.x, note.y);
    await wait(1500);
    await frame(2500);
  }
  await hideCursor();
  endGif(shotName("07-margin", lang, theme, "gif"));
  await c.eval(`app.workspace.rightSplit.collapse();`);
  await setMargin(false);
  await zoom(ZOOM);

  // GIF 2 : extraction depuis la palette, tableau Kanban, puis retour au passage par le lien ↩.
  await scroll(0);
  startGif();
  await showCursor();
  await frame(1000);
  await c.eval(`app.commands.executeCommandById("command-palette:open");`);
  await wait(300);
  await typeSlowly(L.extractQuery);
  await frame(700);
  await press("Enter");
  await wait(2500);
  await frame(2200);
  const link = await c.eval(`
    const a = [...document.querySelectorAll(".kanban-plugin__item a, .kanban-plugin a")].find((x) => x.textContent.trim() === "↩");
    const r = a?.getBoundingClientRect(); return r && { x: r.left + r.width / 2, y: r.top + r.height / 2, href: a.getAttribute("href") || a.dataset.href || "" };`);
  if (link) {
    await moveTo(link.x, link.y, 12);
    await frame(900);
    // Le lien obsidian:// passerait par le système : on appelle directement son gestionnaire, comme le ferait Obsidian.
    const params = Object.fromEntries(new URL(link.href.replace("obsidian://hypomnema", "https://x/")).searchParams);
    await c.eval(`await app.plugins.plugins.hypomnema.actions.openLink(${JSON.stringify(params)});`);
    await wait(500);
    await frame(2500);
  }
  await hideCursor();
  endGif(shotName("10-extract", lang, theme, "gif"));
  await c.eval(`const d = app.vault.getAbstractFileByPath("Extractions"); if (d) await app.vault.delete(d, true);`);
}

const { langs, themes } = parseArgs();
fs.mkdirSync(OUT, { recursive: true });
// Les scènes vident demo-vault/Extractions pour partir d'un coffre propre : ses notes d'exemple sont remises à la fin.
const EXTRACTIONS = path.join(ROOT, "demo-vault", "Extractions");
const kept = fs.existsSync(EXTRACTIONS) ? fs.readdirSync(EXTRACTIONS).map((f) => [f, fs.readFileSync(path.join(EXTRACTIONS, f))]) : [];
try {
  for (const theme of themes) for (const lang of langs) await scenes(lang, theme);
} finally {
  fs.mkdirSync(EXTRACTIONS, { recursive: true });
  for (const [f, data] of kept) fs.writeFileSync(path.join(EXTRACTIONS, f), data);
  c.close();
}
