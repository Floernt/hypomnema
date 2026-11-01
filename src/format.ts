// Syntaxe des variables {{…}}, commune à tous les gestes — fonctions pures, sans dépendance à Obsidian.
//
//   {{text}} {{note}} …        variable du contexte (gabarit de ligne, nom de fichier, gabarit de note…)
//   {{date}} {{date:DD/MM}}    date du contexte : celle du commentaire dans un gabarit de ligne, du jour ailleurs
//   {{today}} {{today:YYYY}}   date du jour, partout
//   {{date-7d}} {{today+1w}}   date du jour décalée (d, w, m, y)
//   {{VALUE:libellé}}          valeur saisie à l'exécution ; même libellé, même valeur dans tout le geste
//   {{GLOBAL:nom}}             variable globale (elle-même formatée)
//
// Une variable inconnue, ou une saisie encore sans réponse, est laissée telle quelle.

export interface FormatEnv {
  /** Variables du contexte. */
  vars?: Record<string, string>;
  /** Date du contexte (AAAA-MM-JJ), lue par {{date}} ; à défaut, la date du jour. */
  date?: string;
  /** Date du jour (AAAA-MM-JJ). */
  today: string;
  globals?: Record<string, string>;
  /** Réponses aux {{VALUE:…}}, par libellé. */
  values?: Record<string, string>;
  /** Mise en forme d'une date ; par défaut, seuls les jetons YYYY, MM et DD sont reconnus. */
  formatDate?: (iso: string, format: string) => string;
}

const TOKEN = /\{\{([A-Za-z_]+)(?:([+-])(\d+)([dwmy]))?(?::([^{}]*))?\}\}/g;
const ISO = "YYYY-MM-DD";
const MAX_DEPTH = 5;

export function basicDate(iso: string, format: string): string {
  const [y, m, d] = iso.split("-");
  return format.replace(/YYYY/g, y).replace(/MM/g, m).replace(/DD/g, d);
}

/** Décale une date AAAA-MM-JJ de n jours, semaines, mois ou années. */
export function shiftDate(iso: string, n: number, unit: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (unit === "d") date.setUTCDate(date.getUTCDate() + n);
  else if (unit === "w") date.setUTCDate(date.getUTCDate() + 7 * n);
  else if (unit === "m") date.setUTCMonth(date.getUTCMonth() + n);
  else if (unit === "y") date.setUTCFullYear(date.getUTCFullYear() + n);
  return date.toISOString().slice(0, 10);
}

export function format(template: string, env: FormatEnv, depth = 0): string {
  const fmt = env.formatDate ?? basicDate;
  return template.replace(TOKEN, (m, name: string, sign?: string, n?: string, unit?: string, arg?: string) => {
    const key = name.toLowerCase();
    if (key === "value") return arg !== undefined && env.values?.[arg.trim()] !== undefined ? env.values[arg.trim()] : m;
    if (key === "global") {
      const g = arg !== undefined ? env.globals?.[arg.trim()] : undefined;
      return g === undefined ? m : depth < MAX_DEPTH ? format(g, env, depth + 1) : g;
    }
    if (key === "date" || key === "today") {
      // Un décalage part toujours du jour : {{date-7d}} sert à filtrer « depuis une semaine ».
      let iso = key === "date" && !sign ? (env.date ?? env.today) : env.today;
      if (sign) iso = shiftDate(iso, (sign === "-" ? -1 : 1) * Number(n), unit!);
      return arg ? fmt(iso, arg) : basicDate(iso, ISO);
    }
    if (sign || arg !== undefined) return m;
    return env.vars?.[name] ?? m;
  });
}

/** Libellés des {{VALUE:…}} d'un ou plusieurs textes, variables globales comprises, sans doublon. */
export function promptsIn(templates: string[], globals: Record<string, string> = {}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (s: string, depth: number) => {
    for (const m of s.matchAll(TOKEN)) {
      const key = m[1].toLowerCase();
      const arg = m[5]?.trim();
      if (arg === undefined) continue;
      if (key === "value" && !seen.has(arg)) {
        seen.add(arg);
        out.push(arg);
      } else if (key === "global" && globals[arg] !== undefined && depth < MAX_DEPTH) {
        visit(globals[arg], depth + 1);
      }
    }
  };
  for (const t of templates) visit(t, 0);
  return out;
}

/**
 * Seuil d'un filtre « depuis » : une date AAAA-MM-JJ, ou une expression comme {{date-7d}}.
 * Renvoie undefined si le filtre est vide ou illisible.
 */
export function resolveSince(since: string | undefined, today: string): string | undefined {
  const s = since?.trim();
  if (!s) return undefined;
  const iso = format(s, { today });
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : undefined;
}

/** Retire {{cursor}} d'un texte et renvoie la position où il se trouvait (fin du texte à défaut). */
export function takeCursor(text: string): { text: string; cursor: number } {
  const i = text.indexOf("{{cursor}}");
  if (i < 0) return { text, cursor: text.length };
  return { text: text.slice(0, i) + text.slice(i + "{{cursor}}".length), cursor: i };
}
