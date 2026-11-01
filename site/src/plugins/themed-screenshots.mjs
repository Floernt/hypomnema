// Plugin HAST (processeur Markdown Sätteri d'Astro) : chaque capture « /screenshots/nom.ext » des pages est doublée
// de sa variante claire « nom-light.ext » quand elle existe. Les captures d'origine montrent Obsidian en thème
// sombre ; le site n'affiche que celle qui correspond à son propre thème (classes hy-only-dark / hy-only-light,
// voir src/styles/hypomnema.css).
import { existsSync } from "node:fs";
import { join } from "node:path";

// Astro regroupe ce module avant de l'exécuter : son propre emplacement n'est pas fiable. On part du dossier du site,
// d'où sont lancés dev et build, et des captures que scripts/sync-assets.mjs y a copiées.
const shots = join(process.cwd(), "public", "screenshots");

/** Chemin de la variante claire d'une capture, ou null si elle n'existe pas. */
export function lightVariant(src) {
  const m = /^\/screenshots\/(.+)\.(png|gif|jpe?g|webp)$/i.exec(src);
  if (!m || m[1].endsWith("-light")) return null;
  const file = `${m[1]}-light.${m[2]}`;
  return existsSync(join(shots, file)) ? `/screenshots/${file}` : null;
}

function withClass(props, cls) {
  const current = props.className ?? [];
  return [...(Array.isArray(current) ? current : String(current).split(" ")), cls];
}

export const themedScreenshots = {
  name: "themed-screenshots",
  element: {
    filter: ["img"],
    visit(node, ctx) {
      const props = node.properties ?? {};
      if (typeof props.src !== "string") return;
      const light = lightVariant(props.src);
      if (!light) return;
      ctx.insertAfter(node, {
        type: "element",
        tagName: "img",
        properties: { ...props, src: light, className: withClass(props, "hy-only-light") },
        children: [],
      });
      ctx.setProperty(node, "className", withClass(props, "hy-only-dark"));
    },
  },
};
