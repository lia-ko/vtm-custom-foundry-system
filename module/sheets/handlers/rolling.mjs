import { safePrompt } from "../../helpers/safe-dialog.mjs";
/** Rolling, rouse check, and frenzy handlers. */

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".attr-row.rollable", sheet._onStatRoll.bind(sheet));
  html.on("click", ".quick-roll", sheet._onStatRoll.bind(sheet));
  html.on("click", ".rouse-check", sheet._onRouseCheck.bind(sheet));
  html.on("click", ".frenzy-check", sheet._onFrenzyCheck.bind(sheet));
  html.on("click", ".end-frenzy", sheet._onEndFrenzy.bind(sheet));
}

export async function _onStatRoll(event) {
  if (event.target.closest(".dot-set")) return;
  event.preventDefault();

  const rollType = event.currentTarget.dataset.rollType || "";
  const rollKey = event.currentTarget.dataset.rollKey || "";
  const preAttr = rollType === "attribute" ? rollKey : "";
  const preSkill = rollType === "skill" ? rollKey : "";

  const content = await renderTemplate(`${DIALOG_PATH}/roll-dialog.hbs`, this._buildRollOptions(preAttr, preSkill));

  const result = await safePrompt({
    title: rollKey ? `Roll ${this._formatLabel(rollKey)}` : "Quick Roll",
    content,
    callback: html => ({
      attr: html.find('[name="attr"]').val(),
      skill: html.find('[name="skill"]').val(),
      mod: parseInt(html.find('[name="mod"]').val()) || 0,
      diff: parseInt(html.find('[name="diff"]').val()) || 1,
      hunger: parseInt(html.find('[name="hunger"]').val()) || 0,
    }),
  });
  if (!result) return;

  const system = this.actor.system;
  const pool = Math.max(1, (system.attributes[result.attr] ?? 0) + this._getSkillValue(system, result.skill) + result.mod);
  const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");
  await VTMDiceRoller.v5Roll({
    pool, hunger: result.hunger, difficulty: result.diff,
    label: `${this._formatLabel(result.attr)} + ${this._formatLabel(result.skill)}`,
    actor: this.actor,
  });
}

export async function _onRouseCheck(event) {
  event.preventDefault();
  const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");
  await VTMDiceRoller.rouseCheck({ label: "Rouse Check", count: 1, actor: this.actor });
}

export async function _onFrenzyCheck(event) {
  event.preventDefault();
  const system = this.actor.system;
  const wpThird = Math.max(1, Math.floor(system.humanity / 3));

  const content = await renderTemplate(`${DIALOG_PATH}/frenzy-dialog.hbs`, {
    willpower: system.willpower.current,
    humanityThird: wpThird,
    defaultPool: system.willpower.current + wpThird,
    hungerWarning: system.hunger >= 4,
    hungerLevel: system.hunger,
  });

  const result = await safePrompt({
    title: "Frenzy Check",
    content,
    callback: html => ({
      fType: html.find('[name="fType"]').val(),
      pool: parseInt(html.find('[name="pool"]').val()) || 1,
      diff: parseInt(html.find('[name="diff"]').val()) || 3,
    }),
  });
  if (!result) return;

  const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");
  const rollResult = await VTMDiceRoller.v5Roll({
    pool: result.pool, hunger: 0, difficulty: result.diff,
    label: `Frenzy Check (${result.fType})`, actor: this.actor,
  });

  if (rollResult.successes < result.diff) {
    await this.actor.update({ "system.frenzy": result.fType });
    ui.notifications.warn(`${this.actor.name} enters ${result.fType} frenzy!`);
  } else {
    ui.notifications.info(`${this.actor.name} resists the Beast.`);
  }
}

export async function _onEndFrenzy(event) {
  event.preventDefault();
  await this.actor.update({ "system.frenzy": "" });
}
