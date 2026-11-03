// Reproduit la partie « Source code » du scan du catalogue Obsidian, qui lit tous les .ts du dépôt.
// Lancé depuis la racine : npm run lint
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig([
  {
    ignores: ["**/node_modules/**", "main.js", "site/dist/**", "site/.astro/**", "test-vault/**", "demo-vault/**"],
  },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: root,
        projectService: true,
      },
    },
  },
  {
    // Scripts utilisateur (new Function) : le bot le signale en avertissement, non bloquant, et la règle
    // ne peut pas être désactivée dans le code (eslint-comments/no-restricted-disable). On s'aligne sur lui.
    files: ["src/runner.ts"],
    rules: { "obsidianmd/rule-custom-message": "warn" },
  },
]);
