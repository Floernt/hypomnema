import { describe, expect, it } from "vitest";
import { ExtractOptions, mergeNew, renderExtraction, Source } from "../src/extract";
import { layout } from "../src/marginLayout";
import { parse } from "../src/syntax";

const NOTE = [
  "Texte %%[a1%%premier passage%%a1]%% puis %%[a2%%second\npassage%%a2]%% et un point %%[a3%%%%a3]%% ici.",
  "Marqué sans texte : %%[a4%%rien%%a4]%%.",
  "",
  "%% annotations",
  "[a1] 2026-10-28 #idee Une idée",
  "    sur deux lignes",
  "  [a1.1] 2026-10-30 Une réponse",
  "[a2] 2026-10-29 #a-faire Vérifier | la source",
  "[a3] 2026-10-29 Sans catégorie",
  "%%",
  "",
].join("\n");

const src = (path = "Lectures/Article.md", doc = NOTE): Source => ({ path, basename: path.split("/").pop()!.replace(/\.md$/, ""), parsed: parse(doc) });

function opts(over: Partial<ExtractOptions> = {}): ExtractOptions {
  return {
    format: "list",
    lineTemplate: "{{text}} — « {{quote}} » {{link}}",
    includeReplies: true,
    categories: [
      { name: "Idée", tag: "idee" },
      { name: "À faire", tag: "a-faire" },
      { name: "Question", tag: "question" },
    ],
    date: "2026-10-31",
    labels: { uncategorized: "Sans catégorie", done: "Fait", columns: ["Note", "Catégorie", "Date", "Passage", "Commentaire", "Lien"] },
    ...over,
  };
}

describe("extraction", () => {
  it("écrit les propriétés pour Dataview", () => {
    const out = renderExtraction([src()], opts());
    expect(out.startsWith("---\nhypomnema-extract: true\nhypomnema-source:\n  - \"[[Lectures/Article]]\"\nhypomnema-date: 2026-10-31\ntags:\n  - idee\n  - a-faire\n---\n")).toBe(true);
  });

  it("liste : une section par catégorie, dans l'ordre des réglages, sans catégorie vide", () => {
    const out = renderExtraction([src()], opts());
    expect(out.indexOf("## Idée")).toBeLessThan(out.indexOf("## À faire"));
    expect(out.indexOf("## À faire")).toBeLessThan(out.indexOf("## Sans catégorie"));
    expect(out).not.toContain("## Question");
    expect(out).toContain(
      "- Une idée\n  sur deux lignes — « premier passage » [↩](obsidian://hypomnema?file=Lectures%2FArticle.md&id=a1)\n  - 2026-10-30 Une réponse",
    );
    expect(out).toContain("« second passage »");
    expect(out).toContain("« passage et un point ▮ ici. »"); // contexte d'un point
    expect(out).not.toContain("id=a4"); // passage marqué sans texte
  });

  it("gabarit : variables connues remplacées, inconnues laissées telles quelles", () => {
    const out = renderExtraction([src()], opts({ lineTemplate: "{{category}} {{tag}} {{date}} {{note}} {{id}} {{inconnu}}", includeReplies: false }));
    expect(out).toContain("- Idée #idee 2026-10-28 [[Lectures/Article|Article]] a1 {{inconnu}}");
    expect(out).not.toContain("Une réponse");
  });

  it("tableau : une ligne par commentaire, barres échappées, retours à la ligne en <br>", () => {
    const out = renderExtraction([src()], opts({ format: "table" }));
    expect(out).toContain("| Note | Catégorie | Date | Passage | Commentaire | Lien |\n| --- | --- | --- | --- | --- | --- |");
    expect(out).toContain("| Vérifier \\| la source |");
    expect(out).toContain("Une idée<br>sur deux lignes<br>↳ 2026-10-30 Une réponse");
    expect(out.match(/^\| \[\[/gm)).toHaveLength(3);
  });

  it("Kanban : propriété du plugin, une colonne par catégorie (même vide) et une colonne Fait", () => {
    const out = renderExtraction([src()], opts({ format: "kanban" }));
    expect(out).toContain("kanban-plugin: board");
    expect(out).toContain("## Question\n\n## Sans catégorie\n");
    expect(out.endsWith("## Fait\n")).toBe(true);
    expect(out).toContain("- [ ] Une idée\n  sur deux lignes");
    expect(out).toContain("\n  ↳ 2026-10-30 Une réponse");
  });

  it("plusieurs notes, avec le coffre dans le lien", () => {
    const out = renderExtraction([src("A.md"), src("B.md")], opts({ vault: "Mon coffre" }));
    expect(out).toContain('  - "[[A]]"\n  - "[[B]]"');
    expect(out).toContain("obsidian://hypomnema?vault=Mon%20coffre&file=B.md&id=a2");
  });
});

describe("ajout sans écraser", () => {
  it("n'ajoute rien si tout est déjà là", () => {
    const first = renderExtraction([src()], opts({ format: "kanban" }));
    expect(mergeNew(first, [src()], opts({ format: "kanban" }))).toEqual({ text: first, added: 0 });
  });

  it("conserve une carte déplacée et n'ajoute que le nouveau commentaire, dans sa colonne", () => {
    const o = opts({ format: "kanban" });
    let board = renderExtraction([src()], o);
    // L'utilisateur déplace la carte a2 dans « Fait » et la coche.
    const card = board.split("\n").find((l) => l.includes("id=a2"))!;
    board = board.replace(card + "\n", "").replace("## Fait\n", `## Fait\n\n${card.replace("[ ]", "[x]")}\n`);

    const doc2 = NOTE.replace("[a3] 2026-10-29 Sans catégorie", "[a3] 2026-10-29 Sans catégorie\n[a5] 2026-11-02 #idee Nouvelle idée").replace(
      " ici.",
      " ici %%[a5%%nouveau%%a5]%%.",
    );
    const { text, added } = mergeNew(board, [src(undefined, doc2)], o);
    expect(added).toBe(1);
    expect(text.match(/id=a2\)/g)).toHaveLength(1);
    expect(text).toContain("- [x] Vérifier");
    const idee = text.slice(text.indexOf("## Idée"), text.indexOf("## À faire"));
    expect(idee).toContain("Nouvelle idée");
  });

  it("crée la section manquante et complète un tableau", () => {
    const list = "---\nhypomnema-extract: true\n---\n\n## Idée\n\n- ancien\n";
    const { text } = mergeNew(list, [src()], opts());
    expect(text).toContain("## Idée\n\n- ancien\n- Une idée");
    expect(text).toContain("\n## À faire\n\n- Vérifier");

    const table = renderExtraction([src("A.md")], opts({ format: "table" }));
    const merged = mergeNew(table, [src("A.md"), src("B.md")], opts({ format: "table" }));
    expect(merged.added).toBe(3);
    expect(merged.text.match(/^\| \[\[/gm)).toHaveLength(6);
  });
});

describe("marge", () => {
  it("place chaque note à la hauteur de son passage, sans chevauchement et dans l'ordre", () => {
    const out = layout(
      [
        { id: "b", top: 105, height: 40 },
        { id: "a", top: 100, height: 30 },
        { id: "c", top: 400, height: 20 },
      ],
      8,
    );
    expect(out).toEqual([
      { id: "a", top: 100 },
      { id: "b", top: 138 },
      { id: "c", top: 400 },
    ]);
  });
});
