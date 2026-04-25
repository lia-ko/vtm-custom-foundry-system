/** VTM V5 Blood Potency Effects Table — helpers wrapping raw JSON data. */

import BLOOD_POTENCY_TABLE from "./json/blood-potency.json" with { type: "json" };
export { BLOOD_POTENCY_TABLE };

export function getBloodPotencyEffects(bp) {
  return BLOOD_POTENCY_TABLE[Math.clamp(bp, 0, 10)];
}
