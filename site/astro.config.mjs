// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const repo = "https://github.com/Floernt/hypomnema";

export default defineConfig({
  site: "https://hypomnema.tools",
  base: "/",
  integrations: [
    starlight({
      title: "Hypomnema",
      description: "Obsidian plugin for augmented reading: comment on passages, sort comments into categories, extract them into notes.",
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
