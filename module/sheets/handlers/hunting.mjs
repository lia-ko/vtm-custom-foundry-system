import { safePrompt } from "../../helpers/safe-dialog.mjs";
/** Hunting and feeding handlers. */

import { RESONANCE_DATA } from "../../data/resonances.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".hunt-btn", sheet._onHunt.bind(sheet));
}

/**
 * Roll a random resonance based on ST-configured weights.
 * @returns {{ type: string, data: object, intensity: string, intensityData: object }}
 */
function rollResonance() {
  // Parse weights from settings
  const weightStr = game.settings.get("vtm-custom", "resonanceWeights") || "20,20,20,20,20";
  const weights = weightStr.split(",").map(w => parseInt(w.trim()) || 0);
  const types = ["sanguine", "choleric", "melancholic", "phlegmatic", "empty"];

  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedType = "empty";
  for (let i = 0; i < types.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { selectedType = types[i]; break; }
  }

  // Roll intensity (fleeting 60%, intense 30%, acute 10%)
  const intRoll = Math.random() * 100;
  let intensity;
  if (intRoll < 60) intensity = "fleeting";
  else if (intRoll < 90) intensity = "intense";
  else intensity = "acute";

  // Empty blood has no intensity
  if (selectedType === "empty") intensity = "fleeting";

  return {
    type: selectedType,
    data: RESONANCE_DATA.types[selectedType],
    intensity,
    intensityData: RESONANCE_DATA.intensities[intensity],
  };
}

export async function _onHunt(event) {
  event.preventDefault();
  const system = this.actor.system;

  // Get ST settings
  const defaultDifficulty = game.settings.get("vtm-custom", "huntingDifficulty");
  const defaultPoolDesc = game.settings.get("vtm-custom", "huntingPool");
  const hungerSlaked = game.settings.get("vtm-custom", "hungerSlaked");

  // Build the roll options
  const content = await renderTemplate(`${DIALOG_PATH}/hunt-dialog.hbs`, {
    ...this._buildRollOptions(),
    difficulty: defaultDifficulty,
    poolDescription: defaultPoolDesc,
    currentHunger: system.hunger,
    hungerSlaked,
    isAnimal: false,
  });

  const result = await safePrompt({
    title: "Hunt",
    content,
    callback: html => ({
      attr: html.find('[name="attr"]').val(),
      skill: html.find('[name="skill"]').val(),
      mod: parseInt(html.find('[name="mod"]').val()) || 0,
      diff: parseInt(html.find('[name="diff"]').val()) || 1,
      hunger: parseInt(html.find('[name="hunger"]').val()) || 0,
      isAnimal: html.find('[name="isAnimal"]').is(":checked"),
    }),
  });
  if (!result) return;

  // Roll the hunting pool
  const attrVal = system.attributes[result.attr] ?? 0;
  const skillVal = this._getSkillValue(system, result.skill);
  const pool = Math.max(1, attrVal + skillVal + result.mod);

  const { VTMDiceRoller } = await import("../../dice/VTMDiceRoller.mjs");
  const rollResult = await VTMDiceRoller.v5Roll({
    pool,
    hunger: result.hunger,
    difficulty: result.diff,
    label: `Hunting (${this._formatLabel(result.attr)} + ${this._formatLabel(result.skill)})`,
    actor: this.actor,
  });

  // Process result
  if (!rollResult.passed) {
    // Failed hunt — no feeding, possible Masquerade issues on bestial failure
    let failMsg = `${this.actor.name} failed to find prey.`;
    if (rollResult.bestialFailure) {
      failMsg += " The Beast lashes out — a Masquerade breach or worse may have occurred.";
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="vtm-roll"><div class="vtm-roll-label">Hunt Failed</div><div class="vtm-roll-info">${failMsg}</div></div>`,
    });
    return;
  }

  // Successful hunt — determine resonance and reduce hunger
  const resonance = result.isAnimal
    ? { type: "animal", data: RESONANCE_DATA.types.animal, intensity: "fleeting", intensityData: RESONANCE_DATA.intensities.fleeting }
    : rollResonance();

  // Calculate hunger reduction (account for Blood Potency)
  let actualSlaked = hungerSlaked;
  if (result.isAnimal) {
    actualSlaked = 1; // Animals always slake only 1
    if (system.bloodPotency >= 4) actualSlaked = 0;
    else if (system.bloodPotency >= 2) actualSlaked = Math.max(0, actualSlaked - 1);
  }

  // Minimum hunger from animal blood is 1
  const currentHunger = system.hunger;
  let newHunger = Math.max(0, currentHunger - actualSlaked);
  if (result.isAnimal && newHunger < 1) newHunger = 1;

  // Messy crit on hunt — you may have drained or killed the vessel
  const messyWarning = rollResult.messyCrit
    ? "The feeding was savage — the vessel may be dead or critically injured. Humanity check required."
    : "";

  // Update character
  const updateData = {
    "system.hunger": newHunger,
    "system.resonance": resonance.type,
    "system.lastFeedDate": new Date().toLocaleDateString(),
  };
  await this.actor.update(updateData);

  // Build chat output
  const resColor = resonance.data.color;
  const resBonus = resonance.type !== "empty" && resonance.type !== "animal"
    ? `<div style="font-size:9px;color:${resColor};margin-top:3px">Bonus to: ${resonance.data.disciplines.join(", ")} (${resonance.intensityData.name}: +${resonance.intensityData.bonus} die${resonance.intensityData.bonus > 1 ? "s" : ""})</div>`
    : "";

  const chatContent = `
    <div class="vtm-roll vtm-hunt-result">
      <div class="vtm-roll-label">Hunt Successful</div>
      <div class="vtm-roll-info">Hunger: ${currentHunger} → ${newHunger} (slaked ${currentHunger - newHunger})</div>
      <div style="display:flex;align-items:center;gap:8px;margin:6px 0">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${resColor};border:1px solid rgba(255,255,255,0.2)"></span>
        <span style="font-weight:bold;color:${resColor}">${resonance.data.name}</span>
        <span style="font-size:9px;color:#8a8880">${resonance.intensityData.name}</span>
      </div>
      <div style="font-size:10px;color:#8a8880;font-style:italic">${resonance.data.emotion}</div>
      ${resBonus}
      ${messyWarning ? `<div class="vtm-roll-warning messy" style="margin-top:6px">${messyWarning}</div>` : ""}
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    content: chatContent,
  });
}
