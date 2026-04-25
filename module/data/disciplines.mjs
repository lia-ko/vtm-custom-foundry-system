/** VTM V5 Discipline Database — helpers wrapping raw JSON data. */

import DISCIPLINE_DB from "./json/disciplines.json" with { type: "json" };
export { DISCIPLINE_DB };

export function getAvailableDisciplines() {
  return Object.entries(DISCIPLINE_DB).map(([name, data]) => ({
    name,
    icon: data.icon,
    color: data.color,
  }));
}

export function getAllPowers(name) {
  return DISCIPLINE_DB[name]?.powers ?? [];
}
