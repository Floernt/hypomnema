import { moment } from "obsidian";

// Textes de l'interface. La langue suit celle d'Obsidian ; l'anglais sert de langue par défaut.

const en = {
  cmdComment: "Comment on selection or cursor",
  cmdOpenPanel: "Show comments panel",
  ribbon: "Comments panel",
  menuSelection: "Comment on selection",
  menuHere: "Comment here",

  panelTitle: "Comments",
  panelNoNote: "Open a note to see its comments.",
  panelEmpty: "No comments yet. Place the cursor or select a passage, then right-click → “Comment”, or use the hotkey you assigned.",
  orphans: "⚠ {n} comment(s) whose passage has disappeared (markers deleted)",
  point: "(point)",
  passageMissing: "Passage not found (markers deleted)",
  noComment: "no comment",

  edit: "Edit",
  reply: "Reply",
  deleteReply: "Delete reply",
  deleteThread: "Delete thread",
  none: "None",
  placeholderComment: "Your comment…",
  placeholderReply: "Your reply…",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",
  confirmTitle: "Confirm deletion",
  confirmDelete: "Delete this comment? The source text is kept.",
  confirmDeleteWithReplies: "Delete this comment and its {n} reply(ies)? The source text is kept.",
  emptyComment: "The comment is empty.",
  blockOne: "💬 1 comment — annotation block (click to show)",
  blockMany: "💬 {n} comments — annotation block (click to show)",

  settingsIntro:
    "Each category links a colour to a tag. A comment filed under a category colours its passage and adds the tag to the " +
    "note's properties; the tag is removed when no comment of that category remains, unless it was already there before.",
  settingsCategories: "Comment categories",
  settingsNoCategory: "No category.",
  settingsName: "Name",
  settingsTag: "tag",
  deleteCategory: "Delete category",
  newCategory: "New category",
  addCategory: "Add category",
  defaultCategoryName: "Idea",
  defaultCategoryTag: "idea",

  "error.in-block": "You cannot comment on the annotation block itself.",
  "error.cuts-marker": "The selection cuts through an existing comment marker.",
  "error.not-found": "Comment not found.",
};

type Key = keyof typeof en;

const fr: Record<Key, string> = {
  cmdComment: "Commenter la sélection ou le curseur",
  cmdOpenPanel: "Afficher le panneau des commentaires",
  ribbon: "Panneau des commentaires",
  menuSelection: "Commenter la sélection",
  menuHere: "Commenter ici",

  panelTitle: "Commentaires",
  panelNoNote: "Ouvrez une note pour voir ses commentaires.",
  panelEmpty:
    "Aucun commentaire. Placez le curseur ou sélectionnez un passage, puis clic droit → « Commenter », ou le raccourci que vous lui avez attribué.",
  orphans: "⚠ {n} commentaire(s) dont le passage a disparu (marqueurs supprimés)",
  point: "(point)",
  passageMissing: "Passage introuvable (marqueurs supprimés)",
  noComment: "sans commentaire",

  edit: "Modifier",
  reply: "Répondre",
  deleteReply: "Supprimer la réponse",
  deleteThread: "Supprimer le fil",
  none: "Aucune",
  placeholderComment: "Votre commentaire…",
  placeholderReply: "Votre réponse…",
  cancel: "Annuler",
  save: "Enregistrer",
  delete: "Supprimer",
  confirmTitle: "Confirmer la suppression",
  confirmDelete: "Supprimer ce commentaire ? Le texte source est conservé.",
  confirmDeleteWithReplies: "Supprimer ce commentaire et ses {n} réponse(s) ? Le texte source est conservé.",
  emptyComment: "Le commentaire est vide.",
  blockOne: "💬 1 commentaire — bloc d'annotations (cliquer pour l'afficher)",
  blockMany: "💬 {n} commentaires — bloc d'annotations (cliquer pour l'afficher)",

  settingsIntro:
    "Chaque catégorie associe une couleur à un tag. Un commentaire classé dans une catégorie colore son passage et ajoute le " +
    "tag aux propriétés de la note ; le tag est retiré quand plus aucun commentaire de cette catégorie n'y figure, sauf s'il était déjà présent avant.",
  settingsCategories: "Catégories de commentaires",
  settingsNoCategory: "Aucune catégorie.",
  settingsName: "Nom",
  settingsTag: "tag",
  deleteCategory: "Supprimer la catégorie",
  newCategory: "Nouvelle catégorie",
  addCategory: "Ajouter une catégorie",
  defaultCategoryName: "Idée",
  defaultCategoryTag: "idee",

  "error.in-block": "Impossible de commenter le bloc d'annotations lui-même.",
  "error.cuts-marker": "La sélection coupe un marqueur de commentaire existant.",
  "error.not-found": "Commentaire introuvable.",
};

// Langues disponibles, indexées par le code de langue d'Obsidian (« fr », « de », « pt-br »…).
// Pour ajouter une langue : un dictionnaire typé Record<Key, string> ci-dessus, puis une ligne ici.
const locales: Record<string, Record<Key, string>> = { en, fr };

function dictionary(): Record<Key, string> {
  const code = moment.locale().toLowerCase();
  return locales[code] ?? locales[code.split("-")[0]] ?? en;
}

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  const dict = dictionary();
  return dict[key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
