/**
 * VTM V5 Dice Roller
 *
 * V5 rules:
 *  - Roll pool d10. 6+ = success. 10s pair for crits (+2 bonus successes per pair).
 *  - Hunger dice replace some normal dice. Hunger 10 in a crit pair = messy critical.
 *  - Hunger 1 on a failed roll = bestial failure.
 *  - Difficulty = number of successes needed.
 */

const CHAT_PATH = "systems/vtm-custom/templates/chat";

export class VTMDiceRoller {

  /**
   * V5-style roll (primary rolling mode).
   */
  static async v5Roll({ pool = 1, hunger = 0, difficulty = 1, label = "", actor = null } = {}) {
    pool = Math.max(pool, 1);
    hunger = Math.clamp(hunger, 0, 5);
    difficulty = Math.max(difficulty, 1);

    const hungerCount = Math.min(hunger, pool);
    const normalCount = pool - hungerCount;

    const parts = [];
    if (normalCount > 0) parts.push(`${normalCount}d10`);
    if (hungerCount > 0) parts.push(`${hungerCount}d10`);
    const roll = await new Roll(parts.join(" + ") || "1d10").evaluate();

    const normalDice = roll.terms[0]?.results?.map(r => r.result) ?? [];
    const hungerDice = (hungerCount > 0 && roll.terms[2]) ? roll.terms[2].results.map(r => r.result) : [];

    let successes = 0, critNormal = 0, critHunger = 0, bestialOnes = 0;
    const results = [];

    for (const die of normalDice) {
      const isSuccess = die >= 6;
      if (isSuccess) successes++;
      if (die === 10) critNormal++;
      results.push({ value: die, class: die === 10 ? "success crit" : isSuccess ? "success" : "failure", hunger: false });
    }

    for (const die of hungerDice) {
      const isSuccess = die >= 6;
      if (isSuccess) successes++;
      if (die === 10) critHunger++;
      if (die === 1) bestialOnes++;
      results.push({ value: die, class: die === 10 ? "hunger-success hunger-crit" : die === 1 ? "bestial" : isSuccess ? "hunger-success" : "hunger-fail", hunger: true });
    }

    const critPairs = Math.floor((critNormal + critHunger) / 2);
    successes += critPairs * 2;

    const passed = successes >= difficulty;
    const messyCrit = critPairs > 0 && critHunger > 0 && passed;
    const bestialFailure = !passed && bestialOnes > 0;

    let outcome, outcomeClass;
    if (messyCrit) { outcome = "Messy Critical"; outcomeClass = "messy-critical"; }
    else if (critPairs > 0 && passed) { outcome = "Critical Success"; outcomeClass = "critical"; }
    else if (bestialFailure) { outcome = "Bestial Failure"; outcomeClass = "bestial-failure"; }
    else if (!passed && successes === 0) { outcome = "Total Failure"; outcomeClass = "failure"; }
    else if (!passed) { outcome = "Failure"; outcomeClass = "failure"; }
    else { outcome = "Success"; outcomeClass = "success"; }

    const content = await renderTemplate(`${CHAT_PATH}/v5-roll.hbs`, {
      label, pool, hungerCount, difficulty, results, successes, outcome, outcomeClass, messyCrit, bestialFailure,
    });

    await roll.toMessage({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      flavor: label || "V5 Roll",
      content,
    });

    return { roll, results, successes, outcome, outcomeClass, messyCrit, bestialFailure, passed };
  }

  /**
   * Rouse Check — roll 1d10. Failure (1-5) increases Hunger.
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

    let newHunger = null;
    let hungerWarning = false;
    if (actor) {
      const currentHunger = actor.system.hunger;
      newHunger = Math.min(5, currentHunger + failures);
      if (failures > 0) await actor.update({ "system.hunger": newHunger });
      hungerWarning = newHunger >= 5;
    }

    const outcomeText = failures === 0
      ? "No Hunger gain"
      : `Hunger +${failures}${newHunger !== null ? ` (now ${newHunger})` : ""}`;

    const content = await renderTemplate(`${CHAT_PATH}/rouse-check.hbs`, {
      label, results, count, multiCheck: count > 1,
      failed: failures > 0, outcomeText, hungerWarning,
    });

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      flavor: label,
      content,
    });

    return { results, failures, hungerGain: failures, newHunger };
  }
}
