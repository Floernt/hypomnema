// Placement des notes en marge — fonction pure, sans dépendance à Obsidian.

export interface MarginItem {
  id: string;
  top: number; // hauteur souhaitée : celle du passage commenté
  height: number;
}

/**
 * Chaque note se place à la hauteur de son passage ; si elle chevauche la précédente, elle est repoussée
 * vers le bas. L'ordre du texte est conservé.
 */
export function layout(items: MarginItem[], gap = 8): { id: string; top: number }[] {
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const out: { id: string; top: number }[] = [];
  let floor = -Infinity;
  for (const it of sorted) {
    const top = Math.max(it.top, floor);
    out.push({ id: it.id, top });
    floor = top + it.height + gap;
  }
  return out;
}
