/** VTM V5 Merits & Flaws Database — helpers wrapping raw JSON data. */

import MERITS_FLAWS_DB from "./json/merits-flaws.json" with { type: "json" };
export { MERITS_FLAWS_DB };

export function getMeritsFlaws(type = null, category = null) {
  return MERITS_FLAWS_DB.filter(mf =>
    (type === null || mf.type === type) &&
    (category === null || mf.category === category)
  );
}
