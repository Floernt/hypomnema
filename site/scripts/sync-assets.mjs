// Copie avant dev et build ce que le site reprend du reste du dépôt, qui en reste la seule source :
// - ../docs/screenshots/ (écrit par scripts/capture*.mjs) vers public/screenshots/ ;
// - ../brand/ (logo, jetons et polices de la charte) vers src/assets/brand/, src/styles/brand/ et public/favicon.svg.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(site, "..");

function copy(source, target, filter = () => true) {
  if (!existsSync(source)) {
    console.error(`sync-assets: ${source} not found`);
    process.exit(1);
  }
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const files = readdirSync(source).filter(filter);
  for (const f of files) cpSync(join(source, f), join(target, f));
  console.log(`sync-assets: ${files.length} file(s) copied to ${target.slice(site.length + 1)}`);
}

copy(join(repo, "docs", "screenshots"), join(site, "public", "screenshots"), (f) => /\.(png|gif|jpe?g|webp|svg)$/i.test(f));
// Logo : les SVG de toutes les déclinaisons, à plat, dans src/assets/brand/ (logo de l'en-tête, page d'accueil) ;
// l'icône sur tuile papier sert aussi de favicon, qui doit être dans public/.
const logo = join(repo, "brand", "logo", "svg");
const brandAssets = join(site, "src", "assets", "brand");
rmSync(brandAssets, { recursive: true, force: true });
mkdirSync(brandAssets, { recursive: true });
for (const dir of readdirSync(logo)) for (const f of readdirSync(join(logo, dir))) cpSync(join(logo, dir, f), join(brandAssets, f));
cpSync(join(logo, "icon", "hypomnema-icon-paper.svg"), join(site, "public", "favicon.svg"));
console.log(`sync-assets: logo copied to src/assets/brand, favicon to public/favicon.svg`);
// Charte : jetons et polices, importés par src/styles/hypomnema.css.
const styles = join(site, "src", "styles", "brand");
copy(join(repo, "brand", "design-system"), styles, (f) => f === "tokens.css");
copy(join(repo, "brand", "design-system", "fonts"), join(styles, "fonts"));
