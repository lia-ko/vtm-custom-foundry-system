import { safePrompt } from "../../helpers/safe-dialog.mjs";
/** Backgrounds, merits, and flaws handlers. */

import { getMeritsFlaws } from "../../data/merits-flaws.mjs";
import { BACKGROUND_DB } from "../../data/backgrounds.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".add-background", sheet._onAddBackground.bind(sheet));
  html.on("click", ".delete-background", sheet._onDeleteItem.bind(sheet, "backgrounds"));
  html.on("click", ".add-merit", sheet._onAddMeritFlaw.bind(sheet, "merit"));
  html.on("click", ".add-flaw", sheet._onAddMeritFlaw.bind(sheet, "flaw"));
  html.on("click", ".add-custom-merit", sheet._onAddCustomMeritFlaw.bind(sheet, "merit"));
  html.on("click", ".add-custom-flaw", sheet._onAddCustomMeritFlaw.bind(sheet, "flaw"));
  html.on("click", ".delete-merit", sheet._onDeleteItem.bind(sheet, "merits"));
  html.on("click", ".delete-flaw", sheet._onDeleteItem.bind(sheet, "flaws"));
}

export async function _onAddBackground(event) {
  event.preventDefault();
  const owned = this.actor.system.backgrounds.map(b => b.name);
  const available = BACKGROUND_DB.filter(b => !owned.includes(b.name));

  if (available.length === 0) {
    const name = await this._promptInput("Background Name (custom)");
    if (!name) return;
    const bgs = foundry.utils.deepClone(this.actor.system.backgrounds);
    bgs.push({ name, value: 1, description: "" });
    await this.actor.update({ "system.backgrounds": bgs });
    return;
  }

  const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
    label: "Background",
    options: available.map(b => ({ value: b.name, label: `${b.name} (${b.min}-${b.max} dots)` })),
    showRating: true,
  });

  const result = await safePrompt({
    title: "Add Background", content,
    callback: html => ({ name: html.find('[name="selection"]').val(), rating: parseInt(html.find('[name="rating"]').val()) || 1 }),
  });
  if (!result) return;

  const dbEntry = available.find(b => b.name === result.name);
  const bgs = foundry.utils.deepClone(this.actor.system.backgrounds);
  bgs.push({ name: result.name, value: Math.clamp(result.rating, dbEntry?.min || 1, dbEntry?.max || 5), description: dbEntry?.description || "" });
  await this.actor.update({ "system.backgrounds": bgs });
}

export async function _onAddMeritFlaw(type, event) {
  event.preventDefault();
  const arrayKey = type === "merit" ? "merits" : "flaws";
  const owned = this.actor.system[arrayKey].map(m => m.name);
  const available = getMeritsFlaws(type).filter(mf => !owned.includes(mf.name));

  if (available.length === 0) { ui.notifications.info(`All ${type}s already added.`); return; }

  const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
    label: type === "merit" ? "Merit" : "Flaw",
    options: available.map(mf => ({ value: mf.name, label: `[${mf.category}] ${mf.name} (${mf.min}-${mf.max} dots)` })),
    showRating: true,
  });

  const result = await safePrompt({
    title: `Add ${type === "merit" ? "Merit" : "Flaw"}`, content,
    callback: html => ({ name: html.find('[name="selection"]').val(), rating: parseInt(html.find('[name="rating"]').val()) || 1 }),
  });
  if (!result) return;

  const dbEntry = available.find(mf => mf.name === result.name);
  if (!dbEntry) return;

  const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
  arr.push({ name: dbEntry.name, value: Math.clamp(result.rating, dbEntry.min, dbEntry.max), category: dbEntry.category, description: dbEntry.description });
  await this.actor.update({ [`system.${arrayKey}`]: arr });
}

export async function _onAddCustomMeritFlaw(type, event) {
  event.preventDefault();
  const arrayKey = type === "merit" ? "merits" : "flaws";
  const content = await renderTemplate(`${DIALOG_PATH}/custom-merit-flaw.hbs`);

  const result = await safePrompt({
    title: `Add Custom ${type === "merit" ? "Merit" : "Flaw"}`, content,
    callback: html => {
      const name = html.find('[name="name"]').val()?.trim();
      if (!name) return null;
      return { name, value: parseInt(html.find('[name="rating"]').val()) || 1, category: html.find('[name="category"]').val() || "Custom", description: html.find('[name="desc"]').val() || "" };
    },
  });
  if (!result) return;

  const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
  arr.push(result);
  await this.actor.update({ [`system.${arrayKey}`]: arr });
}
