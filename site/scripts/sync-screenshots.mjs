// Copie les captures de ../docs/screenshots/ vers public/screenshots/ avant dev et build.
// docs/screenshots/ reste la seule source : scripts/capture.mjs y écrit, le site les reprend.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "..", "..", "docs", "screenshots");
const target = join(here, "..", "public", "screenshots");

if (!existsSync(source)) {
  console.error(`sync-screenshots: ${source} not found`);
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
const files = readdirSync(source).filter((f) => /\.(png|gif|jpe?g|webp|svg)$/i.test(f));
for (const f of files) cpSync(join(source, f), join(target, f));
console.log(`sync-screenshots: ${files.length} file(s) copied to public/screenshots/`);
