// Liens facultatifs avec d'autres plugins : chacun n'agit que si le plugin est actif, et ne casse rien sinon.

import { App, TFile } from "obsidian";

/** Accès au gestionnaire de plugins, absent des définitions publiques d'Obsidian. */
interface PluginRegistry {
  enabledPlugins?: Set<string>;
  plugins?: Record<string, unknown>;
}

function registry(app: App): PluginRegistry {
  return (app as unknown as { plugins?: PluginRegistry }).plugins ?? {};
}

export function pluginEnabled(app: App, id: string): boolean {
  return registry(app).enabledPlugins?.has(id) ?? false;
}

export const DATAVIEW = "dataview";
export const QUICKADD = "quickadd";
export const TEMPLATER = "templater-obsidian";

interface TemplaterPlugin {
  templater?: { overwrite_file_commands?: (file: TFile, activeFile?: boolean) => Promise<void> };
}

/** Exécute les balises <% %> de Templater dans une note, si Templater est actif. */
export async function runTemplater(app: App, file: TFile): Promise<void> {
  if (!pluginEnabled(app, TEMPLATER)) return;
  const tp = registry(app).plugins?.[TEMPLATER] as TemplaterPlugin | undefined;
  await tp?.templater?.overwrite_file_commands?.(file);
}

/** Commandes d'Obsidian, elles aussi hors des définitions publiques. */
interface CommandRegistry {
  commands?: Record<string, { id: string; name: string }>;
  executeCommandById?: (id: string) => boolean;
}

function commandRegistry(app: App): CommandRegistry {
  return (app as unknown as { commands?: CommandRegistry }).commands ?? {};
}

export function listCommands(app: App): { id: string; name: string }[] {
  return Object.values(commandRegistry(app).commands ?? {}).sort((a, b) => a.name.localeCompare(b.name));
}

export function executeCommand(app: App, id: string): boolean {
  return commandRegistry(app).executeCommandById?.(id) ?? false;
}
