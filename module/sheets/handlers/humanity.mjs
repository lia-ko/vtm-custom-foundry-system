/** Humanity, stains, and remorse/degeneration handlers. */

import { safePrompt } from "../../helpers/safe-dialog.mjs";

const CHAT_PATH = "systems/vtm-custom/templates/chat";

export function registerListeners(html, sheet) {
  html.on("click", ".add-stain", sheet._onAddStain.bind(sheet));
  html.on("click", ".degen-roll", sheet._onRemorseRoll.bind(sheet));
  html.on("click", ".add-touchstone", sheet._onAddTouchstone.bind(sheet));
  html.on("click", ".delete-touchstone", sheet._onDeleteItem.bind(sheet, "touchstones"));
}

export async function _onAddStain(event) {
  event.preventDefault();
  const system = this.actor.system;
  const maxStains = 10 - system.humanity;
  const current = system.stains;

  if (current >= maxStains) {
    ui.notifications.warn("Stains already at maximum — remorse roll required.");
    return;
  }

  const result = await safePrompt({
    title: "Add Stain",
    content: `<form>
      <div class="form-group"><label>Stains to add</label><input type="number" name="count" value="1" min="1" max="${maxStains - current}" /></div>
      <div class="form-group"><label>Reason</label><input type="text" name="reason" placeholder="e.g. Killed a mortal" /></div>
    </form>`,
    callback: html => ({
      count: parseInt(html.find('[name="count"]').val()) || 1,
      reason: html.find('[name="reason"]').val() || "",
    }),
  });
  if (!result) return;

  const newStains = Math.min(maxStains, current + result.count);
  await this.actor.update({ "system.stains": newStains });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    content: `<div class="vtm-roll"><div class="vtm-roll-label">${this.actor.name} gains ${result.count} Stain${result.count > 1 ? "s" : ""}</div><div class="vtm-roll-info">${result.reason ? result.reason + " — " : ""}Stains: ${current} → ${newStains} / Humanity: ${this.actor.system.humanity}</div>${newStains >= maxStains ? '<div class="vtm-roll-warning bestial">Stains at maximum! Remorse roll required at end of session.</div>' : ""}</div>`,
  });
}

/**
 * Remorse Roll (V5 Degeneration)
 *
 * Roll dice equal to (10 - Humanity - Stains), minimum 1 die.
 * This is a pool of "remaining humanity dots that aren't stained."
 * If you get at least 1 success (6+), you feel remorse — Humanity stays, Stains reset to 0.
 * If you get 0 successes, you lose 1 Humanity and Stains reset to 0.
 *
 * Note: This is NOT a V5 hunger roll — no hunger dice, no crits. Just plain d10s.
 */
export async function _onRemorseRoll(event) {
  event.preventDefault();
  const system = this.actor.system;

  if (system.stains === 0) {
    ui.notifications.info("No stains — no remorse roll needed.");
    return;
  }

  // Pool = number of empty dots (not humanity, not stained), minimum 1
  const emptyDots = 10 - system.humanity - system.stains;
  const pool = Math.max(1, emptyDots);

  const roll = await new Roll(`${pool}d10`).evaluate();
  const dice = roll.terms[0]?.results?.map(r => r.result) ?? [];
  const successes = dice.filter(d => d >= 6).length;
  const passed = successes > 0;

  let newHumanity = system.humanity;
  let outcome, outcomeClass;

  if (passed) {
    outcome = "Remorse felt";
    outcomeClass = "success";
  } else {
    newHumanity = Math.max(0, system.humanity - 1);
    outcome = "Humanity lost";
    outcomeClass = "failure";
  }

  // Reset stains and update humanity
  await this.actor.update({
    "system.stains": 0,
    "system.humanity": newHumanity,
  });

  // Build chat message
  const diceHtml = dice.map(d =>
    `<span class="vtm-die ${d >= 6 ? "success" : "failure"}">${d}</span>`
  ).join(" ");

  const content = `
    <div class="vtm-roll vtm-remorse-roll">
      <div class="vtm-roll-label">Remorse Roll</div>
      <div class="vtm-roll-info">Pool: ${pool} (10 - ${system.humanity} Humanity - ${system.stains} Stains)</div>
      <div class="vtm-roll-dice">${diceHtml}</div>
      <div class="vtm-roll-result ${outcomeClass}">
        ${outcome}${!passed ? ` — Humanity ${system.humanity} → ${newHumanity}` : " — Humanity holds"}
      </div>
      <div class="vtm-roll-info">Stains reset to 0.</div>
      ${newHumanity === 0 ? '<div class="vtm-roll-warning bestial">Humanity has reached 0. The Beast has won.</div>' : ""}
    </div>
  `;

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    flavor: "Remorse Roll",
    content,
  });
}

export async function _onAddTouchstone(event) {
  event.preventDefault();
  const result = await safePrompt({
    title: "Add Touchstone",
    content: `<form>
      <div class="form-group"><label>Name</label><input type="text" name="name" placeholder="e.g. Sarah Chen (sister)" autofocus /></div>
      <div class="form-group"><label>Conviction</label><input type="text" name="conviction" placeholder="e.g. Never harm the innocent" /></div>
      <div class="form-group"><label>Description</label><textarea name="desc" rows="2" placeholder="Relationship and significance"></textarea></div>
    </form>`,
    callback: html => {
      const name = html.find('[name="name"]').val()?.trim();
      if (!name) return null;
      return { name, conviction: html.find('[name="conviction"]').val() || "", description: html.find('[name="desc"]').val() || "" };
    },
  });
  if (!result) return;

  const touchstones = foundry.utils.deepClone(this.actor.system.touchstones);
  touchstones.push(result);
  await this.actor.update({ "system.touchstones": touchstones });
}
