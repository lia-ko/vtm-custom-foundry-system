import { safePrompt } from "../../helpers/safe-dialog.mjs";
/** Inventory handlers: weapons, gear, currency. */

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".weapon-rollable", sheet._onWeaponRoll.bind(sheet));
  html.on("click", ".add-weapon", sheet._onAddWeapon.bind(sheet));
  html.on("click", ".delete-weapon", sheet._onDeleteItem.bind(sheet, "weapons"));
  html.on("click", ".add-gear", sheet._onAddGear.bind(sheet));
  html.on("click", ".delete-gear", sheet._onDeleteItem.bind(sheet, "gear"));
  html.on("click", ".adjust-cash", sheet._onAdjustCash.bind(sheet));
}

export async function _onWeaponRoll(event) {
  if (event.target.closest(".item-delete")) return;
  event.preventDefault();

  const index = parseInt(event.currentTarget.dataset.weaponIndex);
  const weapon = this.actor.system.weapons[index];
  if (!weapon) return;

  const system = this.actor.system;
  const content = await renderTemplate(`${DIALOG_PATH}/roll-dialog.hbs`, {
    attributes: Object.keys(system.attributes).map(k => ({
      key: k, label: this._formatLabel(k), value: system.attributes[k], selected: k === weapon.attribute,
    })),
    skills: [
      ...Object.entries(system.talents),
      ...Object.entries(system.skills),
      ...Object.entries(system.knowledges),
    ].map(([k, v]) => ({ key: k, label: this._formatLabel(k), value: v, selected: k === weapon.skill })),
    hunger: system.hunger,
  });

  const result = await safePrompt({
    title: `Attack — ${weapon.name}`,
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

  const finalAttr = system.attributes[result.attr] ?? 0;
  const finalSkill = this._getSkillValue(system, result.skill);
  const pool = Math.max(1, finalAttr + finalSkill + result.mod);

  const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");
  await VTMDiceRoller.v5Roll({
    pool,
    hunger: result.hunger,
    difficulty: result.diff,
    label: `${weapon.name} (${this._formatLabel(result.attr)} + ${this._formatLabel(result.skill)})`,
    actor: this.actor,
  });
}

export async function _onAddWeapon(event) {
  event.preventDefault();
  const name = await this._promptInput("Weapon Name");
  if (!name) return;
  const weapons = foundry.utils.deepClone(this.actor.system.weapons);
  weapons.push({ name, type: "Melee", attribute: "dexterity", skill: "melee", price: 0 });
  await this.actor.update({ "system.weapons": weapons });
}

export async function _onAddGear(event) {
  event.preventDefault();
  const name = await this._promptInput("Gear Name");
  if (!name) return;
  const gear = foundry.utils.deepClone(this.actor.system.gear);
  gear.push({ name, description: "", price: 0 });
  await this.actor.update({ "system.gear": gear });
}

export async function _onAdjustCash(event) {
  event.preventDefault();
  const mode = event.currentTarget.dataset.mode;
  const amount = await this._promptNumber(mode === "add" ? "Amount to add" : "Amount to spend");
  if (!amount || amount <= 0) return;
  const current = this.actor.system.currency.cash;
  await this.actor.update({ "system.currency.cash": mode === "add" ? current + amount : Math.max(0, current - amount) });
}
