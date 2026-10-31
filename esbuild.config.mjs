import esbuild from "esbuild";
import builtins from "builtin-modules";
import { copyFileSync, mkdirSync } from "node:fs";

const prod = process.argv[2] === "production";
const testPluginDir = "test-vault/.obsidian/plugins/hypomnema";

// Copie le build dans le coffre de test à chaque compilation.
const copyToTestVault = {
  name: "copy-to-test-vault",
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length) return;
      mkdirSync(testPluginDir, { recursive: true });
      for (const f of ["main.js", "manifest.json", "styles.css"]) {
        copyFileSync(f, `${testPluginDir}/${f}`);
      }
      console.log(`[hypomnema] build copié dans ${testPluginDir}`);
    });
  },
};

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  plugins: [copyToTestVault],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
