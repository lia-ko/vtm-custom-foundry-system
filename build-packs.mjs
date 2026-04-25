/**
 * Build script: generates Foundry v12+ compendium packs
 * as classic LevelDB-compatible NDJSON .db files.
 *
 * Run with: node build-packs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(import.meta.dirname, "module/data/json");
const PACKS_DIR = join(import.meta.dirname, "packs");

const DISCIPLINE_DB = JSON.parse(readFileSync(join(DATA_DIR, "disciplines.json"), "utf8"));
const RITUAL_DB = JSON.parse(readFileSync(join(DATA_DIR, "rituals.json"), "utf8"));
const CLAN_DB = JSON.parse(readFileSync(join(DATA_DIR, "clans.json"), "utf8"));

function makeId() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ==================== DISCIPLINES ====================
console.log("Building disciplines compendium...");
mkdirSync(join(PACKS_DIR, "disciplines"), { recursive: true });

const discEntries = [];
for (const [discName, discData] of Object.entries(DISCIPLINE_DB)) {
  const powersHtml = discData.powers.map(p => {
    const amalgamLine = p.amalgam ? `<p><strong>Amalgam:</strong> ${p.amalgam}</p>` : "";
    return `<h3>Level ${p.level}: ${p.name}</h3><p><strong>Cost:</strong> ${p.cost} | <strong>Pool:</strong> ${p.pool} | <strong>Type:</strong> ${p.type === "cb" ? "Combat" : p.type === "ri" ? "Passive" : "Utility"}</p>${amalgamLine}<p>${p.description}</p><hr>`;
  }).join("\n");

  discEntries.push({
    _id: makeId(),
    name: discName,
    pages: [{
      _id: makeId(),
      name: discName,
      type: "text",
      title: { show: true, level: 1 },
      text: { content: `<h2>${discData.icon} ${discName}</h2>\n${powersHtml}`, format: 1 },
      sort: 0,
    }],
    sort: 0,
    flags: {},
  });
}

// Write as single NDJSON file
writeFileSync(
  join(PACKS_DIR, "disciplines.db"),
  discEntries.map(e => JSON.stringify(e)).join("\n") + "\n"
);
console.log(`  Created ${discEntries.length} discipline entries.`);

// ==================== RITUALS ====================
console.log("Building rituals compendium...");
mkdirSync(join(PACKS_DIR, "rituals"), { recursive: true });

const ritualsByLevel = {};
for (const r of RITUAL_DB) {
  if (!ritualsByLevel[r.level]) ritualsByLevel[r.level] = [];
  ritualsByLevel[r.level].push(r);
}

const ritEntries = [];
for (const [level, rituals] of Object.entries(ritualsByLevel)) {
  const ritualsHtml = rituals.map(r =>
    `<h3>${r.name}</h3><p><strong>Cost:</strong> ${r.cost} | <strong>Pool:</strong> ${r.pool} | <strong>Time:</strong> ${r.time}</p><p><strong>Ingredients:</strong> ${r.ingredients}</p><p>${r.description}</p><hr>`
  ).join("\n");

  ritEntries.push({
    _id: makeId(),
    name: `Level ${level} Rituals`,
    pages: [{
      _id: makeId(),
      name: `Level ${level} Rituals`,
      type: "text",
      title: { show: true, level: 1 },
      text: { content: `<h2>Blood Sorcery Rituals — Level ${level}</h2>\n${ritualsHtml}`, format: 1 },
      sort: 0,
    }],
    sort: parseInt(level),
    flags: {},
  });
}

writeFileSync(
  join(PACKS_DIR, "rituals.db"),
  ritEntries.map(e => JSON.stringify(e)).join("\n") + "\n"
);
console.log(`  Created ${ritEntries.length} ritual level entries.`);

// ==================== CLANS ====================
console.log("Building clans compendium...");
mkdirSync(join(PACKS_DIR, "clans"), { recursive: true });

const clanEntries = [];
for (const clan of CLAN_DB) {
  const discList = clan.disciplines.length
    ? `<p><strong>In-Clan Disciplines:</strong> ${clan.disciplines.join(", ")}</p>`
    : `<p><em>No in-clan disciplines.</em></p>`;

  clanEntries.push({
    _id: makeId(),
    name: clan.name,
    pages: [{
      _id: makeId(),
      name: clan.name,
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: `<h2>${clan.name}</h2><p><em>${clan.nickname}</em></p>${discList}<h3>Clan Bane</h3><p>${clan.bane}</p><h3>Compulsion</h3><p>${clan.compulsion}</p>`,
        format: 1,
      },
      sort: 0,
    }],
    sort: 0,
    flags: {},
  });
}

writeFileSync(
  join(PACKS_DIR, "clans.db"),
  clanEntries.map(e => JSON.stringify(e)).join("\n") + "\n"
);
console.log(`  Created ${clanEntries.length} clan entries.`);

console.log("Done! Compendium packs built.");
