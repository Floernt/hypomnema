// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { satteri } from "@astrojs/markdown-satteri";
import { themedScreenshots } from "./src/plugins/themed-screenshots.mjs";

const repo = "https://github.com/Floernt/hypomnema";

export default defineConfig({
  site: "https://hypomnema.tools",
  base: "/",
  // La page « Gestes » est devenue « Actions ».
  redirects: {
    "/concepts/gestures": "/concepts/actions/",
    "/fr/concepts/gestures": "/fr/concepts/actions/",
  },
  markdown: {
    processor: satteri({ hastPlugins: [themedScreenshots] }),
  },
  integrations: [
    starlight({
      title: "Hypomnema",
      description: "Obsidian plugin for augmented reading: comment on passages, sort comments into categories, extract them into notes.",
      // Logo, favicon, jetons et polices viennent de brand/ (copiés par scripts/sync-assets.mjs).
      logo: {
        light: "./src/assets/brand/hypomnema-lockup.svg",
        dark: "./src/assets/brand/hypomnema-lockup-dark.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/hypomnema.css"],
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        fr: { label: "Français", lang: "fr" },
      },
      social: [{ icon: "github", label: "GitHub", href: repo }],
      editLink: { baseUrl: `${repo}/edit/main/site/` },
      lastUpdated: false,
      sidebar: [
        { label: "Getting started", translations: { fr: "Prise en main" }, items: [{ autogenerate: { directory: "getting-started" } }] },
        { label: "Concepts", translations: { fr: "Concepts" }, items: [{ autogenerate: { directory: "concepts" } }] },
        { label: "Method", translations: { fr: "Méthode" }, items: [{ autogenerate: { directory: "method" } }] },
        { label: "Integrations", translations: { fr: "Intégrations" }, items: [{ autogenerate: { directory: "integrations" } }] },
        { label: "Advanced", translations: { fr: "Avancé" }, items: [{ autogenerate: { directory: "advanced" } }] },
        { label: "Reference", translations: { fr: "Référence" }, items: [{ autogenerate: { directory: "reference" } }] },
      ],
    }),
  ],
});
