/** VTM V5 Clan Database — helpers wrapping raw JSON data. */

import CLAN_DB from "./json/clans.json" with { type: "json" };
export { CLAN_DB };

export function getClan(name) {
  return CLAN_DB.find(c => c.name === name) || null;
}
