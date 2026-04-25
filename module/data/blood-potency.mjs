/**
 * VTM V5 Blood Potency Effects Table
 *
 * Index = Blood Potency level (0-10)
 *
 * Each entry contains:
 *   surgeBonus    - dice added on Blood Surge
 *   mendAmount    - superficial damage healed per Rouse
 *   powerBonus    - bonus dice to discipline powers
 *   rouseReroll   - number of Rouse dice re-rolled (0 = none)
 *   baneSeverity  - severity of clan bane
 *   feedingPenalty - description of feeding restriction
 */

export const BLOOD_POTENCY_TABLE = [
  // BP 0 (Thin-bloods)
  {
    surgeBonus: 1,
    mendAmount: 1,
    powerBonus: 0,
    rouseReroll: 0,
    baneSeverity: 0,
    feedingPenalty: "No effect",
  },
  // BP 1
  {
    surgeBonus: 2,
    mendAmount: 1,
    powerBonus: 0,
    rouseReroll: 0,
    baneSeverity: 2,
    feedingPenalty: "No effect",
  },
  // BP 2
  {
    surgeBonus: 2,
    mendAmount: 2,
    powerBonus: 1,
    rouseReroll: 0,
    baneSeverity: 2,
    feedingPenalty: "Animal and bagged blood slakes 1 less Hunger",
  },
  // BP 3
  {
    surgeBonus: 3,
    mendAmount: 2,
    powerBonus: 1,
    rouseReroll: 0,
    baneSeverity: 3,
    feedingPenalty: "Animal and bagged blood slakes 1 less Hunger",
  },
  // BP 4
  {
    surgeBonus: 3,
    mendAmount: 3,
    powerBonus: 2,
    rouseReroll: 0,
    baneSeverity: 3,
    feedingPenalty: "Animal and bagged blood provides no nourishment. Must feed from humans.",
  },
  // BP 5
  {
    surgeBonus: 4,
    mendAmount: 3,
    powerBonus: 2,
    rouseReroll: 1,
    baneSeverity: 4,
    feedingPenalty: "Animal and bagged blood provides no nourishment. Must feed from humans.",
  },
  // BP 6
  {
    surgeBonus: 4,
    mendAmount: 3,
    powerBonus: 3,
    rouseReroll: 1,
    baneSeverity: 4,
    feedingPenalty: "Must drain and kill a human to reduce Hunger below 2.",
  },
  // BP 7
  {
    surgeBonus: 5,
    mendAmount: 3,
    powerBonus: 3,
    rouseReroll: 2,
    baneSeverity: 5,
    feedingPenalty: "Must drain and kill a human to reduce Hunger below 2. Animal/bagged blood causes retching.",
  },
  // BP 8
  {
    surgeBonus: 5,
    mendAmount: 4,
    powerBonus: 4,
    rouseReroll: 2,
    baneSeverity: 5,
    feedingPenalty: "Must drain and kill a human to reduce Hunger below 3.",
  },
  // BP 9
  {
    surgeBonus: 6,
    mendAmount: 4,
    powerBonus: 4,
    rouseReroll: 3,
    baneSeverity: 6,
    feedingPenalty: "Must drain and kill a human to reduce Hunger below 3. Only Kindred vitae fully sates.",
  },
  // BP 10
  {
    surgeBonus: 6,
    mendAmount: 5,
    powerBonus: 5,
    rouseReroll: 3,
    baneSeverity: 6,
    feedingPenalty: "Must drain and kill a human to reduce Hunger below 4. Only Kindred vitae fully sates.",
  },
];

/**
 * Get Blood Potency effects for a given level.
 * @param {number} bp - Blood Potency (0-10)
 * @returns {object}
 */
export function getBloodPotencyEffects(bp) {
  return BLOOD_POTENCY_TABLE[Math.clamp(bp, 0, 10)];
}
