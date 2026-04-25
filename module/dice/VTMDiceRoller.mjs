/**
 * VTM V5 Dice Roller
 *
 * V5 rules:
 *  - Roll pool d10. 6+ = success. 10s pair for crits (+2 bonus successes per pair).
 *  - Hunger dice replace some normal dice. Hunger 10 in a crit pair = messy critical.
 *  - Hunger 1 on a failed roll = bestial failure.
 *  - Difficulty = number of successes needed.
 */
export class VTMDiceRoller {

  /**
   * V5-style roll (primary rolling mode).
   * @param {object} options
   * @param {number} options.pool       - Total dice pool
   * @param {number} options.hunger     - Current hunger (dice replaced)
   * @param {number} options.difficulty - Successes needed (default 1)
   * @param {string} options.label      - Roll description
   * @param {Actor} [options.actor]     - Actor making the roll
   */
  static async v5Roll({ pool = 1, hunger = 0, difficulty = 1, label = "", actor = null } = {}) {
    pool = Math.max(pool, 1);
    hunger = Math.clamp(hunger, 0, 5);
    difficulty = Math.max(difficulty, 1);

    const hungerCount = Math.min(hunger, pool);
    const normalCount = pool - hungerCount;

    // Build roll formula
    const parts = [];
    if (normalCount > 0) parts.push(`${normalCount}d10`);
    if (hungerCount > 0) parts.push(`${hungerCount}d10`);
    const formula = parts.join(" + ") || "1d10";

    const roll = await new Roll(formula).evaluate();

    // Parse results
    const normalDice = roll.terms[0]?.results?.map(r => r.result) ?? [];
    const hungerDice = (hungerCount > 0 && roll.terms[2])
      ? roll.terms[2].results.map(r => r.result)
      : [];

    let successes = 0;
    let critNormal = 0;
    let critHunger = 0;
    let bestialOnes = 0;
    const results = [];

    for (const die of normalDice) {
      const isSuccess = die >= 6;
      if (isSuccess) successes++;
      if (die === 10) critNormal++;
      results.push({
        value: die,
        class: die === 10 ? "success crit" : isSuccess ? "success" : "failure",
        hunger: false,
      });
    }

    for (const die of hungerDice) {
      const isSuccess = die >= 6;
      if (isSuccess) successes++;
      if (die === 10) critHunger++;
      if (die === 1) bestialOnes++;
      results.push({
        value: die,
        class: die === 10 ? "hunger-success hunger-crit"
          : die === 1 ? "bestial"
          : isSuccess ? "hunger-success"
          : "hunger-fail",
        hunger: true,
      });
    }

    // Crit pairs: each pair of 10s gives +2 bonus successes
    const totalCrits = critNormal + critHunger;
    const critPairs = Math.floor(totalCrits / 2);
    successes += critPairs * 2;

    // Determine outcome
    const passed = successes >= difficulty;
    const hasCritPair = critPairs > 0;
    const messyCrit = hasCritPair && critHunger > 0;
    const bestialFailure = !passed && bestialOnes > 0;

    let outcome, outcomeClass;
    if (messyCrit && passed) {
      outcome = "Messy Critical";
      outcomeClass = "messy-critical";
    } else if (hasCritPair && passed) {
      outcome = "Critical Success";
      outcomeClass = "critical";
    } else if (bestialFailure) {
      outcome = "Bestial Failure";
      outcomeClass = "bestial-failure";
    } else if (!passed && successes === 0) {
      outcome = "Total Failure";
      outcomeClass = "failure";
    } else if (!passed) {
      outcome = "Failure";
      outcomeClass = "failure";
    } else {
      outcome = "Success";
      outcomeClass = "success";
    }

    // Build chat message
    const diceHtml = results.map(r =>
      `<span class="vtm-die ${r.class}${r.hunger ? " hunger-die" : ""}">${r.value}</span>`
    ).join(" ");

    const content = `
      <div class="vtm-roll vtm-v5-roll">
        <div class="vtm-roll-label">${label}</div>
        <div class="vtm-roll-info">Pool: ${pool} | Hunger: ${hungerCount} | Need: ${difficulty} successes</div>
        <div class="vtm-roll-dice">${diceHtml}</div>
        <div class="vtm-roll-result ${outcomeClass}">
          ${outcome} (${successes}/${difficulty})
        </div>
        ${messyCrit ? '<div class="vtm-roll-warning messy">A Beast lurks behind this victory...</div>' : ""}
        ${bestialFailure ? '<div class="vtm-roll-warning bestial">The Beast claws at the surface!</div>' : ""}
      </div>
    `;

    const messageData = {
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      flavor: label || "V5 Roll",
      content,
    };

    await roll.toMessage(messageData);

    return { roll, results, successes, outcome, outcomeClass, messyCrit, bestialFailure, passed };
  }

  /**
   * Rouse Check — roll 1d10. Failure (1-5) increases Hunger.
   * @param {object} options
   * @param {string} options.label  - What the rouse is for (e.g. "Blood Surge", "Dominate")
   * @param {number} options.count  - Number of rouse checks (default 1, some powers cost 2)
   * @param {Actor} [options.actor] - Actor making the check. If provided, auto-updates Hunger.
   * @returns {object} { results: [{die, failed}], failures, hungerGain, newHunger }
   */
  static async rouseCheck({ label = "Rouse Check", count = 1, actor = null } = {}) {
    const results = [];
    let failures = 0;

    for (let i = 0; i < count; i++) {
      const roll = await new Roll("1d10").evaluate();
      const die = roll.total;
      const failed = die <= 5;
      if (failed) failures++;
      results.push({ die, failed });
    }

    // Update actor hunger if provided
    let newHunger = null;
    let hungerWarning = false;
    if (actor) {
      const currentHunger = actor.system.hunger;
      newHunger = Math.min(5, currentHunger + failures);
      if (failures > 0) {
        await actor.update({ "system.hunger": newHunger });
      }
      hungerWarning = newHunger >= 5;
    }

    // Build chat message
    const diceHtml = results.map(r =>
      `<span class="vtm-die ${r.failed ? "rouse-fail" : "rouse-pass"}">${r.die}</span>`
    ).join(" ");

    const outcomeText = failures === 0
      ? "No Hunger gain"
      : `Hunger +${failures}${newHunger !== null ? ` (now ${newHunger})` : ""}`;

    const content = `
      <div class="vtm-roll vtm-rouse-check">
        <div class="vtm-roll-label">${label}${count > 1 ? ` (x${count})` : ""}</div>
        <div class="vtm-roll-dice">${diceHtml}</div>
        <div class="vtm-roll-result ${failures > 0 ? "rouse-failed" : "rouse-passed"}">
          ${outcomeText}
        </div>
        ${hungerWarning ? '<div class="vtm-roll-warning bestial">Hunger is at maximum! The Beast demands to feed!</div>' : ""}
      </div>
    `;

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      flavor: label,
      content,
    });

    return { results, failures, hungerGain: failures, newHunger };
  }
}
