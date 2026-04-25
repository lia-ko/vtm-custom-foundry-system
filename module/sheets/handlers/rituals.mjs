/** Ritual and Thin-Blood Alchemy formula handlers. */

import { safePrompt } from "../../helpers/safe-dialog.mjs";
import { RITUAL_DB } from "../../data/rituals.mjs";
import { TB_ALCHEMY_DB } from "../../data/tb-alchemy.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".add-ritual", sheet._onAddRitual.bind(sheet));
  html.on("click", ".add-custom-ritual", sheet._onAddCustomRitual.bind(sheet));
  html.on("click", ".delete-ritual", sheet._onDeleteItem.bind(sheet, "rituals"));
  html.on("click", ".add-formula", sheet._onAddFormula.bind(sheet));
  html.on("click", ".add-custom-formula", sheet._onAddCustomFormula.bind(sheet));
  html.on("click", ".delete-formula", sheet._onDeleteItem.bind(sheet, "formulas"));
}

export async function _onAddRitual(event) {
  event.preventDefault();
  const owned = this.actor.system.rituals.map(r => r.name);
  const available = RITUAL_DB.filter(r => !owned.includes(r.name));

  if (available.length === 0) { ui.notifications.info("All rituals already learned."); return; }

  const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
    label: "Ritual",
    options: available.map(r => ({ value: r.name, label: `Lvl ${r.level} — ${r.name}` })),
    showRating: false,
  });

  const result = await safePrompt({ title: "Add Ritual", content, callback: html => html.find('[name="selection"]').val() });
  if (!result) return;

  const dbEntry = available.find(r => r.name === result);
  if (!dbEntry) return;

  const rituals = foundry.utils.deepClone(this.actor.system.rituals);
  rituals.push({ ...dbEntry, custom: false });
  rituals.sort((a, b) => a.level - b.level);
  await this.actor.update({ "system.rituals": rituals });
}

export async function _onAddCustomRitual(event) {
  event.preventDefault();
  const content = await renderTemplate(`${DIALOG_PATH}/custom-ritual.hbs`);
  const result = await safePrompt({
    title: "Add Custom Ritual",
    content,
    callback: html => {
      const name = html.find('[name="name"]').val()?.trim();
      if (!name) return null;
      return { name, level: parseInt(html.find('[name="level"]').val()), description: html.find('[name="desc"]').val() || "", cost: html.find('[name="cost"]').val() || "1 Rouse", pool: html.find('[name="pool"]').val() || "Int + Blood Sorcery", ingredients: html.find('[name="ingredients"]').val() || "", time: html.find('[name="time"]').val() || "", custom: true };
    },
  });
  if (!result) return;

  const rituals = foundry.utils.deepClone(this.actor.system.rituals);
  rituals.push(result);
  rituals.sort((a, b) => a.level - b.level);
  await this.actor.update({ "system.rituals": rituals });
}

export async function _onAddFormula(event) {
  event.preventDefault();
  const owned = this.actor.system.formulas.map(f => f.name);
  const available = TB_ALCHEMY_DB.filter(f => !owned.includes(f.name));

  if (available.length === 0) { ui.notifications.info("All formulas already learned."); return; }

  const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
    label: "Formula",
    options: available.map(f => ({ value: f.name, label: `Lvl ${f.level} — ${f.name}` })),
    showRating: false,
  });

  const result = await safePrompt({ title: "Add Formula", content, callback: html => html.find('[name="selection"]').val() });
  if (!result) return;

  const dbEntry = available.find(f => f.name === result);
  if (!dbEntry) return;

  const formulas = foundry.utils.deepClone(this.actor.system.formulas);
  formulas.push({ ...dbEntry, custom: false });
  formulas.sort((a, b) => a.level - b.level);
  await this.actor.update({ "system.formulas": formulas });
}

export async function _onAddCustomFormula(event) {
  event.preventDefault();
  const content = await renderTemplate(`${DIALOG_PATH}/custom-ritual.hbs`);
  const result = await safePrompt({
    title: "Add Custom Formula",
    content,
    callback: html => {
      const name = html.find('[name="name"]').val()?.trim();
      if (!name) return null;
      return { name, level: parseInt(html.find('[name="level"]').val()), description: html.find('[name="desc"]').val() || "", cost: html.find('[name="cost"]').val() || "1 Rouse", pool: html.find('[name="pool"]').val() || "Int + Alchemy", ingredients: html.find('[name="ingredients"]').val() || "", time: html.find('[name="time"]').val() || "", custom: true };
    },
  });
  if (!result) return;

  const formulas = foundry.utils.deepClone(this.actor.system.formulas);
  formulas.push(result);
  formulas.sort((a, b) => a.level - b.level);
  await this.actor.update({ "system.formulas": formulas });
}
