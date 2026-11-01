import { describe, expect, it } from "vitest";
import { format, promptsIn, resolveSince, shiftDate, takeCursor } from "../src/format";
import { exportGestes, filterSources, Geste, hasCycle, importGestes } from "../src/gestes";
import { applyTemplate, END, ExtractOptions, mergeNew, START } from "../src/extract";
import { parse } from "../src/syntax";

const today = "2026-11-01";

describe("format", () => {
  it("remplace les variables du contexte et laisse les inconnues", () => {
    expect(format("{{text}} — {{note}} {{nope}}", { today, vars: { text: "A", note: "B" } })).toBe("A — B {{nope}}");
  });

  it("distingue la date du contexte et celle du jour", () => {
    const env = { today, date: "2026-10-31" };
    expect(format("{{date}} / {{today}}", env)).toBe("2026-10-31 / 2026-11-01");
    expect(format("{{date}}", { today })).toBe("2026-11-01");
  });

  it("met en forme et décale les dates depuis le jour", () => {
    expect(format("{{today:DD/MM/YYYY}}", { today })).toBe("01/11/2026");
    expect(format("{{date-7d}}", { today, date: "2020-01-01" })).toBe("2026-10-25");
    expect(format("{{today+1m}}", { today })).toBe("2026-12-01");
    expect(format("{{date:YYYY}}", { today, date: "2020-05-06", formatDate: (iso, f) => `${f}:${iso}` })).toBe("YYYY:2020-05-06");
  });

  it("résout les saisies et les variables globales, elles-mêmes formatées", () => {
    const env = { today, values: { "quoi ?": "la date" }, globals: { lecteur: "F. E.", sig: "{{GLOBAL:lecteur}}, {{today}}" } };
    expect(format("Vérifier {{VALUE:quoi ?}} — {{GLOBAL:sig}}", env)).toBe("Vérifier la date — F. E., 2026-11-01");
    expect(format("{{VALUE:autre}} {{GLOBAL:absent}}", env)).toBe("{{VALUE:autre}} {{GLOBAL:absent}}");
  });

  it("ne boucle pas sur une variable globale qui se cite elle-même", () => {
    expect(format("{{GLOBAL:a}}", { today, globals: { a: "x{{GLOBAL:a}}" } })).toBe("xxxxxx{{GLOBAL:a}}");
  });

  it("liste les saisies, globales comprises, sans doublon", () => {
    expect(promptsIn(["{{VALUE:a}} {{VALUE:b}}", "{{VALUE:a}} {{GLOBAL:g}}"], { g: "{{VALUE:c}}" })).toEqual(["a", "b", "c"]);
  });

  it("lit un seuil « depuis »", () => {
    expect(resolveSince("{{date-7d}}", today)).toBe("2026-10-25");
    expect(resolveSince("2026-01-02", today)).toBe("2026-01-02");
    expect(resolveSince("", today)).toBeUndefined();
    expect(resolveSince("hier", today)).toBeUndefined();
  });

  it("décale en fin de mois et d'année", () => {
    expect(shiftDate("2026-12-31", 1, "d")).toBe("2027-01-01");
    expect(shiftDate("2026-03-01", -1, "w")).toBe("2026-02-22");
  });

  it("repère le curseur", () => {
    expect(takeCursor("Objection : {{cursor}} !")).toEqual({ text: "Objection :  !", cursor: 12 });
    expect(takeCursor("abc")).toEqual({ text: "abc", cursor: 3 });
  });
});

const doc = `Texte %%[a1%%un%%a1]%% et %%[a2%%deux%%a2]%% et %%[a3%%trois%%a3]%%.

%% annotations
[a1] 2026-09-01 #idee Premier
[a2] 2026-10-30 #question Deuxième
[a3] 2026-08-01 Troisième
  [a3.1] 2026-10-31 Relance
%%
`;
const src = [{ path: "Lecture.md", basename: "Lecture", parsed: parse(doc) }];

describe("filterSources", () => {
  it("filtre par catégorie", () => {
    expect(filterSources(src, { categories: ["idee"] })[0].parsed.threads.map((t) => t.id)).toEqual(["a1"]);
  });

  it("retient la dernière activité, réponses comprises", () => {
    expect(filterSources(src, { categories: [], since: "2026-10-25" })[0].parsed.threads.map((t) => t.id)).toEqual(["a2", "a3"]);
  });
});

describe("gestes", () => {
  const gestes: Geste[] = [
    { id: "c1", name: "Fin", kind: "chain", command: true, steps: [{ type: "geste", id: "g1" }] },
    { id: "g1", name: "Menu", kind: "group", command: true, children: ["c1"] },
    { id: "a", name: "Obj", kind: "annotation", command: true, category: "objection", initialText: "" },
  ];

  it("détecte un cycle", () => {
    expect(hasCycle("c1", gestes)).toBe(true);
    expect(hasCycle("a", gestes)).toBe(false);
  });

  it("importe en renouvelant les identifiants pris et en suivant les renvois", () => {
    const r = importGestes(exportGestes(gestes), gestes, ["idee"]);
    const ids = r.gestes.map((g) => g.id);
    expect(ids.some((id) => ["c1", "g1", "a"].includes(id))).toBe(false);
    const chain = r.gestes[0] as Extract<Geste, { kind: "chain" }>;
    expect(chain.steps[0]).toEqual({ type: "geste", id: ids[1] });
    expect(r.missingCategories).toEqual(["objection"]);
  });

  it("refuse un texte qui n'est pas un export", () => {
    expect(() => importGestes("{}", [], [])).toThrow();
    expect(() => importGestes('[{"name":"x","kind":"autre"}]', [], [])).toThrow();
  });
});

const opts: ExtractOptions = {
  format: "list",
  lineTemplate: "{{text}} {{link}}",
  includeReplies: false,
  categories: [{ name: "Idée", tag: "idee" }],
  date: today,
  labels: { uncategorized: "Sans catégorie", done: "Fait", columns: ["N", "C", "D", "P", "Co", "L"] },
};

describe("gabarit", () => {
  it("place les commentaires entre les repères et les sources", () => {
    const out = applyTemplate("# Revue\n\nSources : {{sources}}\n\n{{comments}}\n\n## Mes conclusions\n", src, opts);
    expect(out).toContain("Sources : [[Lecture|Lecture]]");
    expect(out.indexOf(START)).toBeLessThan(out.indexOf("Premier"));
    expect(out.indexOf(END)).toBeLessThan(out.indexOf("## Mes conclusions"));
  });

  it("ajoute en fin de note sans {{comments}}", () => {
    expect(applyTemplate("Intro", src, opts).trimEnd().endsWith(END)).toBe(true);
  });

  it("une nouvelle extraction n'écrit qu'entre les repères", () => {
    const first = applyTemplate("{{comments}}\n\n## Mes conclusions\n\n- conclusion\n", filterSources(src, { categories: ["idee"] }), opts);
    const r = mergeNew(first, src, opts);
    expect(r.added).toBe(2);
    expect(r.text.indexOf("Troisième")).toBeLessThan(r.text.indexOf(END));
    expect(r.text.endsWith("## Mes conclusions\n\n- conclusion\n")).toBe(true);
    expect(mergeNew(r.text, src, opts).added).toBe(0);
  });

  it("le gabarit de ligne garde la date du commentaire", () => {
    const out = applyTemplate("{{comments}}", src, { ...opts, lineTemplate: "{{date}} {{today}} {{text}}" });
    expect(out).toContain("2026-09-01 2026-11-01 Premier");
  });
});
