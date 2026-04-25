import { safePrompt } from "../../helpers/safe-dialog.mjs";
/** XP tracking handlers. */

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".xp-add-btn", sheet._onXpAdd.bind(sheet));
  html.on("click", ".xp-spend-btn", sheet._onXpSpend.bind(sheet));
}

export async function _onXpAdd(event) {
  event.preventDefault();
  const content = await renderTemplate(`${DIALOG_PATH}/xp-dialog.hbs`, { placeholder: "e.g. Session 12 reward" });
  const result = await safePrompt({
    title: "Add XP", content,
    callback: html => ({ amount: parseInt(html.find('[name="amount"]').val()) || 0, reason: html.find('[name="reason"]').val() || "Added" }),
  });
  if (!result || result.amount <= 0) return;

  const log = foundry.utils.deepClone(this.actor.system.xpLog);
  log.push({ type: "add", amount: result.amount, reason: result.reason });
  await this.actor.update({ "system.experience.total": this.actor.system.experience.total + result.amount, "system.xpLog": log });
}

export async function _onXpSpend(event) {
  event.preventDefault();
  const content = await renderTemplate(`${DIALOG_PATH}/xp-dialog.hbs`, { placeholder: "e.g. Occult 4 -> 5" });
  const result = await safePrompt({
    title: "Spend XP", content,
    callback: html => ({ amount: parseInt(html.find('[name="amount"]').val()) || 0, reason: html.find('[name="reason"]').val() || "Spent" }),
  });
  if (!result || result.amount <= 0) return;

  const remaining = this.actor.system.experience.total - this.actor.system.experience.spent;
  if (result.amount > remaining) { ui.notifications.warn("Not enough XP available."); return; }

  const log = foundry.utils.deepClone(this.actor.system.xpLog);
  log.push({ type: "spend", amount: result.amount, reason: result.reason });
  await this.actor.update({ "system.experience.spent": this.actor.system.experience.spent + result.amount, "system.xpLog": log });
}
