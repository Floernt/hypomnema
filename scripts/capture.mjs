// Captures d'écran et GIF de la visite, dans le vrai Obsidian, sur demo-vault/.
//
// 1. npm run build, puis copier main.js, manifest.json et styles.css dans demo-vault/.obsidian/plugins/hypomnema/
//    (installer aussi les plugins Kanban et Dataview dans ce coffre pour les captures 10 et 11).
// 2. Lancer une instance séparée d'Obsidian sur demo-vault, sans toucher à la vôtre :
//      "C:\Program Files\Obsidian\Obsidian.exe" --user-data-dir=<dossier vide> --remote-debugging-port=9333
//    (le dossier contient un obsidian.json qui déclare demo-vault ouvert ; accepter une fois « Trust author »).
// 3. node scripts/capture.mjs [en|fr ...]
//    Les PNG vont dans docs/screenshots/ ; les images des GIF dans un dossier temporaire,
//    assemblées par scripts/frames-to-gif.py (Python + Pillow).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { connect, sleep } from "./cdp.mjs";

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
    marginQuery: "margin",
    extractQuery: "extract comments from this",
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
    marginQuery: "marge",
    extractQuery: "extraire les commentaires de cette",
  },
};

const c = await connect();
const wait = (ms = 600) => sleep(ms);

async function shot(name) {
  await c.eval(`document.querySelectorAll(".notice").forEach((n) => n.remove());`);
  fs.writeFileSync(path.join(OUT, name), await c.screenshot());
  console.log("✓", name);
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
async function typeSlowly(text) {
  for (const ch of text) {
    await c.type(ch);
    if (frames) await frame(60);
  }
}
async function press(key) {
  const code = { Enter: 13, Escape: 27 }[key];
  await c.send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: code });
  await c.send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: code });
}

// --- Mise en place d'une langue ---

async function setup(lang) {
  const L = LANGS[lang];
  const current = await c.eval(`return localStorage.getItem("language") || "en";`);
  if (current !== lang) {
    await c.eval(`localStorage.setItem("language", ${JSON.stringify(lang)}); setTimeout(() => location.reload(), 50); return true;`);
    await sleep(6000);
  }
  await c.eval(`
    require("electron").remote.getCurrentWindow().setContentSize(1280, 800);
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
    return true;`);
  await wait(1200);
}

async function scroll(y) {
  await c.eval(`app.workspace.activeEditor?.editor?.scrollTo(0, ${y});`);
  await wait(700);
}

async function setMargin(on) {
  await c.eval(`const p = app.plugins.plugins.hypomnema; p.settings.display.margin = ${on}; await p.saveSettings();`);
  await wait(700);
}

// --- Scènes ---

async function scenes(lang) {
  const L = LANGS[lang];
  await setup(lang);

  // 07 : commentaires en marge
  await setMargin(true);
  await scroll(560);
  await shot(`07-margin-${lang}.png`);

  // 08 : panneau étroit, les commentaires passent sous le paragraphe
  await c.eval(`app.workspace.rightSplit.expand();`);
  await wait(1200);
  await scroll(560);
  await shot(`08-margin-narrow-${lang}.png`);
  await c.eval(`app.workspace.rightSplit.collapse();`);
  await setMargin(false);

  // 09 : réglages de l'extraction
  await c.eval(`
    app.setting.open(); app.setting.openTabById("hypomnema");
    await new Promise((r) => setTimeout(r, 500));
    const h = [...document.querySelectorAll(".vertical-tab-content .setting-item-heading")].pop();
    h?.scrollIntoView({ block: "start" });`);
  await wait(600);
  await shot(`09-extract-settings-${lang}.png`);
  await c.eval(`app.setting.close();`);
  await wait(400);

  // 10 : extraction en tableau Kanban
  await c.eval(`app.commands.executeCommandById("hypomnema:extract-note");`);
  await wait(2500);
  await shot(`10-extract-kanban-${lang}.png`);

  // 11 : tableau de bord Dataview
  await c.eval(`await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(${JSON.stringify(L.dashboard)}), { state: { mode: "preview" } });`);
  await wait(2500);
  await shot(`11-dataview-dashboard-${lang}.png`);

  // GIF 1 : la marge s'active depuis la palette, puis le panneau la fait passer sous le paragraphe.
  await c.eval(`
    const d = app.vault.getAbstractFileByPath("Extractions"); if (d) await app.vault.delete(d, true);
    await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(${JSON.stringify(L.note)}), { state: { mode: "source", source: false } });`);
  await wait(1000);
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
  endGif(`07-margin-${lang}.gif`);
  await c.eval(`app.workspace.rightSplit.collapse();`);
  await setMargin(false);

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
  endGif(`10-extract-${lang}.gif`);
}

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ["en", "fr"];
fs.mkdirSync(OUT, { recursive: true });
for (const lang of langs) await scenes(lang);
c.close();
