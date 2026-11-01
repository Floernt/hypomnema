---
tags:
  - tableau-de-bord
---
# Tableau de bord de lecture

## Notes d'extraction

```dataview
TABLE dateformat(hypomnema-date, "yyyy-MM-dd") AS "Extraite le", length(hypomnema-source) AS "Notes", tags AS "Catégories"
WHERE hypomnema-extract
SORT hypomnema-date DESC
```

## Tous les commentaires du coffre, du plus récent au plus ancien

```dataviewjs
// Lit le bloc « %% annotations » de chaque note (format de stockage d'Hypomnema).
const ENTRY = /^\[(a\d+)\]\s+(\d{4}-\d{2}-\d{2})(?: #([^\s#]+))?(?: (.*))?$/;
const rows = [];
for (const page of dv.pages()) {
  const file = app.vault.getAbstractFileByPath(page.file.path);
  const text = await app.vault.cachedRead(file);
  const block = text.match(/^%% annotations[ \t]*\n([\s\S]*?)^%%[ \t]*$/m);
  if (!block) continue;
  for (const line of block[1].split("\n")) {
    const m = ENTRY.exec(line);
    if (m && m[4]) rows.push([page.file.link, m[3] ? "#" + m[3] : "", m[2], m[4]]);
  }
}
rows.sort((a, b) => b[2].localeCompare(a[2]));
dv.table(["Note", "Catégorie", "Date", "Commentaire"], rows);
```
