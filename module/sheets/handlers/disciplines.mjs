/** Discipline, power rolling, and clan handlers. */

import { safePrompt } from "../../helpers/safe-dialog.mjs";
import { DISCIPLINE_DB, getAvailableDisciplines, getAllPowers } from "../../data/disciplines.mjs";
import { getClan } from "../../data/clans.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".toggle-disc", sheet._onToggleDisc.bind(sheet));
  html.on("click", ".disc-dots .dot", sheet._onDiscDotClick.bind(sheet));
  html.on("click", ".add-discipline", sheet._onAddDiscipline.bind(sheet));
  html.on("click", ".delete-discipline", sheet._onDeleteDiscipline.bind(sheet));
  html.on("click", ".power-pin", sheet._onTogglePowerPin.bind(sheet));
  html.on("click", ".power-use", sheet._onPowerRoll.bind(sheet));
  html.on("click", ".power-activate", sheet._onPowerActivate.bind(sheet));
  html.on("change", ".clan-select", sheet._onClanChange.bind(sheet));
}

export async function _onToggleDisc(event) {
  if (event.target.closest(".disc-dots") || event.target.closest(".disc-delete")) return;
  event.preventDefault();
  const index = parseInt(event.currentTarget.dataset.index);
  const discs = foundry.utils.deepClone(this.actor.system.disciplines);
  discs[index].open = !discs[index].open;
  await this.actor.update({ "system.disciplines": discs });
}

export async function _onDiscDotClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const discIndex = parseInt(event.currentTarget.dataset.discDot);
  const clickedValue = parseInt(event.currentTarget.dataset.value);
  const discs = foundry.utils.deepClone(this.actor.system.disciplines);
  const disc = discs[discIndex];
  const oldValue = disc.value;
  disc.value = oldValue === clickedValue ? clickedValue - 1 : clickedValue;
  disc.open = true;

  if (disc.value > oldValue) {
    const dbPowers = getAllPowers(disc.name);
    for (let lv = oldValue + 1; lv <= disc.value; lv++) {
      for (const p of dbPowers.filter(p => p.level === lv)) {
        if (!disc.powers.find(ep => ep.name === p.name)) {
          disc.powers.push({ ...p, amalgam: p.amalgam || "", pin: false });
        }
      }
    }
    disc.powers.sort((a, b) => a.level - b.level);
  }

  await this.actor.update({ "system.disciplines": discs });
}

export async function _onAddDiscipline(event) {
  event.preventDefault();
  const owned = this.actor.system.disciplines.map(d => d.name);
  const available = getAvailableDisciplines().filter(d => !owned.includes(d.name));

  if (available.length === 0) {
    const name = await this._promptInput("Discipline Name (custom)");
    if (!name) return;
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    discs.push({ name, path: "", icon: "\u2666", value: 0, color: "", open: true, powers: [] });
    await this.actor.update({ "system.disciplines": discs });
    return;
  }

  const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
    label: "Discipline",
    options: available.map(d => ({ value: d.name, label: `${d.icon} ${d.name}` })),
    showRating: false,
  });

  const result = await safePrompt({ title: "Add Discipline", content, callback: html => html.find('[name="selection"]').val() });
  if (!result) return;

  const dbEntry = DISCIPLINE_DB[result];
  const discs = foundry.utils.deepClone(this.actor.system.disciplines);
  discs.push({ name: result, path: "", icon: dbEntry?.icon || "\u2666", value: 0, color: dbEntry?.color || "", open: true, powers: [] });
  await this.actor.update({ "system.disciplines": discs });
}

export async function _onDeleteDiscipline(event) {
  event.preventDefault();
  event.stopPropagation();
  const index = parseInt(event.currentTarget.dataset.index);
  const discs = foundry.utils.deepClone(this.actor.system.disciplines);
  discs.splice(index, 1);
  await this.actor.update({ "system.disciplines": discs });
}

export async function _onTogglePowerPin(event) {
  event.preventDefault();
  event.stopPropagation();
  const discIdx = parseInt(event.currentTarget.dataset.disc);
  const powerIdx = parseInt(event.currentTarget.dataset.power);
  const discs = foundry.utils.deepClone(this.actor.system.disciplines);
  discs[discIdx].powers[powerIdx].pin = !discs[discIdx].powers[powerIdx].pin;
  await this.actor.update({ "system.disciplines": discs });
}

export async function _onPowerRoll(event) {
  event.preventDefault();
  event.stopPropagation();
  const discIdx = parseInt(event.currentTarget.dataset.disc);
  const powerIdx = parseInt(event.currentTarget.dataset.power);
  const disc = this.actor.system.disciplines[discIdx];
  const power = disc?.powers[powerIdx];
  if (!power) return;

  const rouseMatch = power.cost.match(/(\d+)\s*Rouse/i);
  const rouseCost = rouseMatch ? parseInt(rouseMatch[1]) : 0;

  const content = await renderTemplate(`${DIALOG_PATH}/roll-dialog.hbs`, this._buildRollOptions());
  const result = await safePrompt({
    title: `${disc.name}: ${power.name}`,
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

  const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");

  if (rouseCost > 0) {
    await VTMDiceRoller.rouseCheck({ label: `Rouse: ${power.name}`, count: rouseCost, actor: this.actor });
  }

  const system = this.actor.system;
  const pool = Math.max(1, (system.attributes[result.attr] ?? 0) + this._getSkillValue(system, result.skill) + result.mod);
  await VTMDiceRoller.v5Roll({
    pool, hunger: result.hunger, difficulty: result.diff,
    label: `${power.name} (${this._formatLabel(result.attr)} + ${this._formatLabel(result.skill)})`,
    actor: this.actor,
  });
}

export async function _onPowerActivate(event) {
  event.preventDefault();
  event.stopPropagation();
  const discIdx = parseInt(event.currentTarget.dataset.disc);
  const powerIdx = parseInt(event.currentTarget.dataset.power);
  const disc = this.actor.system.disciplines[discIdx];
  const power = disc?.powers[powerIdx];
  if (!power) return;

  const rouseMatch = power.cost.match(/(\d+)\s*Rouse/i);
  const rouseCost = rouseMatch ? parseInt(rouseMatch[1]) : 0;

  if (rouseCost > 0) {
    const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");
    await VTMDiceRoller.rouseCheck({ label: `Rouse: ${power.name}`, count: rouseCost, actor: this.actor });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    content: `<div class="vtm-roll"><div class="vtm-roll-label">${this.actor.name} activates ${power.name}</div><div class="vtm-roll-info">${disc.name} — ${power.cost}</div></div>`,
  });
}

export async function _onClanChange(event) {
  event.preventDefault();
  const newClan = event.currentTarget.value;
  const clanData = getClan(newClan);

  if (!clanData || !clanData.disciplines.length) {
    await this.actor.update({ "system.clan": newClan });
    return;
  }

  const discs = foundry.utils.deepClone(this.actor.system.disciplines);
  const ownedNames = discs.map(d => d.name);

  for (const discName of clanData.disciplines) {
    if (ownedNames.includes(discName)) continue;
    const dbEntry = DISCIPLINE_DB[discName];
    discs.push({ name: discName, path: "", icon: dbEntry?.icon || "\u2666", value: 0, color: dbEntry?.color || "", open: true, powers: [] });
  }

  await this.actor.update({ "system.clan": newClan, "system.disciplines": discs });
}
