import { describe, expect, it } from "vitest";
import { addAnchor, addComment, addReply, applyChanges, deleteEntry, editEntry, parse } from "../src/syntax";

const D1 = "2026-10-31";
const D2 = "2026-11-04";

function comment(doc: string, passage: string, text: string, date = D1) {
  const from = doc.indexOf(passage);
  const { id, changes } = addComment(doc, from, from + passage.length, text, date);
  return { id, doc: applyChanges(doc, changes) };
}

const ARTICLE = "---\ntags: [lecture]\n---\n# Titre\n\nLe juge a estimé que ==la clause était abusive== en l'espèce.\n\nSecond paragraphe sur le bail commercial.\n";

describe("ajout d'un commentaire", () => {
  it("balise le passage et crée le bloc en fin de note", () => {
    const { id, doc } = comment(ARTICLE, "la clause était abusive", "À rapprocher de Cass. 2023.");
    expect(id).toBe("a1");
    expect(doc).toContain("==%%[a1%%la clause était abusive%%a1]%%==");
    expect(doc.endsWith("\n\n%% annotations\n[a1] 2026-10-31 À rapprocher de Cass. 2023.\n%%\n")).toBe(true);
  });

  it("retrouve le fil, l'extrait et le texte", () => {
    const { doc } = comment(ARTICLE, "la clause était abusive", "Note");
    const [t] = parse(doc).threads;
    expect(t.quote).toBe("la clause était abusive");
    expect(t.root).toEqual({ id: "a1", date: D1, text: "Note" });
    expect(doc.slice(t.anchor!.openTo, t.anchor!.closeFrom)).toBe("la clause était abusive");
  });

  it("ignore les espaces en bord de sélection", () => {
    const from = ARTICLE.indexOf(" en l'espèce");
    const { changes } = addComment(ARTICLE, from, from + " en l'espèce.\n".length, "x", D1);
    expect(applyChanges(ARTICLE, changes)).toContain(" %%[a1%%en l'espèce.%%a1]%%\n");
  });

  it("refuse une sélection qui coupe un marqueur", () => {
    const { doc } = comment(ARTICLE, "la clause", "x");
    const i = doc.indexOf("%%[a1%%");
    expect(() => addComment(doc, i + 3, i + 20, "y", D1)).toThrow(/coupe un marqueur/);
  });

  it("numérote et range les fils dans l'ordre du texte", () => {
    let { doc } = comment(ARTICLE, "bail commercial", "second");
    ({ doc } = comment(doc, "Le juge", "premier"));
    const p = parse(doc);
    expect(p.threads.map((t) => t.id)).toEqual(["a2", "a1"]);
    expect(p.block!.entries.map((e) => e.id)).toEqual(["a2", "a1"]);
  });

  it("préserve les commentaires sur plusieurs lignes et neutralise %%", () => {
    const { doc } = comment(ARTICLE, "Le juge", "Ligne 1\n\nLigne 3 avec %% dedans");
    expect(doc).toContain("[a1] 2026-10-31 Ligne 1\n\n    Ligne 3 avec % % dedans\n%%");
    expect(parse(doc).threads[0].root.text).toBe("Ligne 1\n\nLigne 3 avec % % dedans");
  });

  it("accepte un commentaire imbriqué dans un passage déjà commenté", () => {
    let { doc } = comment(ARTICLE, "la clause était abusive", "large");
    ({ doc } = comment(doc, "clause", "précis"));
    const p = parse(doc);
    expect(p.threads).toHaveLength(2);
    expect(p.threads.find((t) => t.id === "a1")!.quote).toBe("la clause était abusive");
  });
});

describe("réponses, édition, suppression", () => {
  const base = comment(ARTICLE, "la clause était abusive", "Racine").doc;

  it("ajoute des réponses numérotées et indentées", () => {
    let doc = applyChanges(base, addReply(base, "a1", "Réponse 1", D2));
    doc = applyChanges(doc, addReply(doc, "a1", "Réponse 2\nsuite", D2));
    expect(doc).toContain("[a1] 2026-10-31 Racine\n  [a1.1] 2026-11-04 Réponse 1\n  [a1.2] 2026-11-04 Réponse 2\n      suite\n%%");
    expect(parse(doc).threads[0].replies.map((r) => r.text)).toEqual(["Réponse 1", "Réponse 2\nsuite"]);
  });

  it("modifie une entrée sans toucher à sa date", () => {
    const doc = applyChanges(base, editEntry(base, "a1", "Corrigé", D2));
    expect(parse(doc).threads[0].root).toEqual({ id: "a1", date: D1, text: "Corrigé" });
  });

  it("supprime une réponse seule", () => {
    let doc = applyChanges(base, addReply(base, "a1", "R", D2));
    doc = applyChanges(doc, deleteEntry(doc, "a1.1"));
    expect(doc).toBe(base);
  });

  it("supprime un fil entier et restitue le texte d'origine", () => {
    let doc = applyChanges(base, addReply(base, "a1", "R", D2));
    doc = applyChanges(doc, deleteEntry(doc, "a1"));
    expect(doc).toBe(ARTICLE);
  });

  it("supprime un fil parmi d'autres sans toucher aux autres", () => {
    const two = comment(base, "bail commercial", "Autre").doc;
    const doc = applyChanges(two, deleteEntry(two, "a1"));
    expect(doc).not.toContain("a1");
    expect(parse(doc).threads.map((t) => t.root.text)).toEqual(["Autre"]);
  });
});

describe("cas dégradés", () => {
  it("signale un commentaire dont les marqueurs ont disparu", () => {
    const { doc } = comment(ARTICLE, "la clause était abusive", "Orphelin");
    const broken = doc.replace("%%[a1%%", "").replace("%%a1]%%", "");
    const [t] = parse(broken).threads;
    expect(t.anchor).toBeNull();
    expect(t.root.text).toBe("Orphelin");
  });

  it("expose un passage marqué sans commentaire, complétable par édition", () => {
    const doc = ARTICLE.replace("Le juge", "%%[a1%%Le juge%%a1]%%");
    const [t] = parse(doc).threads;
    expect(t.root.text).toBe("");
    const fixed = applyChanges(doc, editEntry(doc, "a1", "Ajouté", D2));
    expect(parse(fixed).threads[0].root).toEqual({ id: "a1", date: D2, text: "Ajouté" });
  });

  it("aller-retour stable : réécrire le bloc ne change rien", () => {
    let { doc } = comment(ARTICLE, "Le juge", "A\n  indenté");
    doc = applyChanges(doc, addReply(doc, "a1", "B", D2));
    expect(applyChanges(doc, editEntry(doc, "a1", parse(doc).threads[0].root.text, D2))).toBe(doc);
  });
});

describe("note du coffre de test", () => {
  it("se lit sans perte", async () => {
    const { readFileSync } = await import("node:fs");
    const doc = readFileSync("test-vault/Article de test.md", "utf8");
    const p = parse(doc);
    // La note sert aussi aux essais manuels : on ne vérifie que les deux fils d'origine.
    const byId = (id: string) => p.threads.find((t) => t.id === id)!;
    expect([byId("a1"), byId("a2")].map((t) => [t.replies.length, !!t.anchor])).toEqual([[1, true], [0, true]]);
    expect(byId("a2").root.text).toContain("\nPenser à l'abus de droit");
    expect(applyChanges(doc, editEntry(doc, "a1", byId("a1").root.text, D2, byId("a1").root.tag))).toBe(doc);
  });
});

describe("commentaire au curseur", () => {
  const at = ARTICLE.indexOf(" en l'espèce");

  it("pose une ancre vide et affiche le contexte", () => {
    const { changes } = addComment(ARTICLE, at, at, "Ici", D1);
    const doc = applyChanges(ARTICLE, changes);
    expect(doc).toContain("abusive==%%[a1%%%%a1]%% en l'espèce.");
    const [t] = parse(doc).threads;
    expect(t.anchor!.closeFrom).toBe(t.anchor!.openTo);
    expect(t.quote).toBe("Le juge a estimé que ==la clause était abusive== ▮ en l'espèce.");
  });

  it("traite une sélection d'espaces comme un point", () => {
    const { changes } = addAnchor(ARTICLE, at, at + 1);
    expect(applyChanges(ARTICLE, changes)).toContain("abusive==%%[a1%%%%a1]%% en");
  });

  it("refuse un curseur placé à l'intérieur d'un marqueur", () => {
    const { doc } = comment(ARTICLE, "la clause", "x");
    const i = doc.indexOf("%%[a1%%") + 2;
    expect(() => addAnchor(doc, i, i)).toThrow(/coupe un marqueur/);
  });

  it("se supprime en restituant le texte d'origine", () => {
    const doc = applyChanges(ARTICLE, addComment(ARTICLE, at, at, "Ici", D1).changes);
    expect(applyChanges(doc, deleteEntry(doc, "a1"))).toBe(ARTICLE);
  });
});

describe("catégories", () => {
  it("écrit et relit le tag après la date", () => {
    const from = ARTICLE.indexOf("Le juge");
    const doc = applyChanges(ARTICLE, addComment(ARTICLE, from, from + 7, "Texte", D1, "droit-prive").changes);
    expect(doc).toContain("[a1] 2026-10-31 #droit-prive Texte\n");
    expect(parse(doc).threads[0].root).toEqual({ id: "a1", date: D1, tag: "droit-prive", text: "Texte" });
  });

  it("change ou retire la catégorie à l'édition", () => {
    const { doc } = comment(ARTICLE, "Le juge", "Texte");
    const tagged = applyChanges(doc, editEntry(doc, "a1", "Texte", D2, "droit/fiscal"));
    expect(parse(tagged).threads[0].root.tag).toBe("droit/fiscal");
    const plain = applyChanges(tagged, editEntry(tagged, "a1", "Texte", D2));
    expect(plain).toBe(doc);
  });

  it("ne confond pas un commentaire commençant par # avec une catégorie", () => {
    const { doc } = comment(ARTICLE, "Le juge", "#important à relire");
    expect(doc).toContain("[a1] 2026-10-31 \\#important à relire");
    expect(parse(doc).threads[0].root).toEqual({ id: "a1", date: D1, text: "#important à relire" });
  });

  it("addAnchor puis editEntry équivaut à addComment", () => {
    const from = ARTICLE.indexOf("Le juge");
    const direct = applyChanges(ARTICLE, addComment(ARTICLE, from, from + 7, "Texte", D1, "x").changes);
    const draft = applyChanges(ARTICLE, addAnchor(ARTICLE, from, from + 7).changes);
    expect(applyChanges(draft, editEntry(draft, "a1", "Texte", D1, "x"))).toBe(direct);
  });
});
