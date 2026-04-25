/**
 * Build script: generates Foundry v12 compendium JSON source files
 * from the JSON data files.
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

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeId() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ==================== DISCIPLINES ====================
console.log("Building disciplines compendium...");
const discDir = join(PACKS_DIR, "disciplines");
mkdirSync(discDir, { recursive: true });

for (const [discName, discData] of Object.entries(DISCIPLINE_DB)) {
  const slug = slugify(discName);
  const powersHtml = discData.powers.map(p => {
    const amalgamLine = p.amalgam ? `<p><strong>Amalgam:</strong> ${p.amalgam}</p>` : "";
    return `
      <h3>Level ${p.level}: ${p.name}</h3>
      <p><strong>Cost:</strong> ${p.cost} | <strong>Pool:</strong> ${p.pool} | <strong>Type:</strong> ${p.type === "cb" ? "Combat" : p.type === "ri" ? "Passive" : "Utility"}</p>
      ${amalgamLine}
      <p>${p.description}</p>
      <hr>
    `;
  }).join("\n");

  const entry = {
    _id: makeId(),
    name: discName,
    pages: [{
      _id: makeId(),
      name: discName,
      type: "text",
      text: { content: `<h2>${discData.icon} ${discName}</h2>\n${powersHtml}`, format: 1 },
      sort: 0,
    }],
  };

  writeFileSync(join(discDir, `${slug}.json`), JSON.stringify(entry, null, 2));
}
console.log(`  Created ${Object.keys(DISCIPLINE_DB).length} discipline entries.`);

// ==================== RITUALS ====================
console.log("Building rituals compendium...");
const ritDir = join(PACKS_DIR, "rituals");
mkdirSync(ritDir, { recursive: true });

const ritualsByLevel = {};
for (const r of RITUAL_DB) {
  if (!ritualsByLevel[r.level]) ritualsByLevel[r.level] = [];
  ritualsByLevel[r.level].push(r);
}

for (const [level, rituals] of Object.entries(ritualsByLevel)) {
  const ritualsHtml = rituals.map(r => `
    <h3>${r.name}</h3>
    <p><strong>Cost:</strong> ${r.cost} | <strong>Pool:</strong> ${r.pool} | <strong>Time:</strong> ${r.time}</p>
    <p><strong>Ingredients:</strong> ${r.ingredients}</p>
    <p>${r.description}</p>
    <hr>
  `).join("\n");

  const entry = {
    _id: makeId(),
    name: `Level ${level} Rituals`,
    pages: [{
      _id: makeId(),
      name: `Level ${level} Rituals`,
      type: "text",
      text: { content: `<h2>Blood Sorcery Rituals — Level ${level}</h2>\n${ritualsHtml}`, format: 1 },
      sort: 0,
    }],
  };

  writeFileSync(join(ritDir, `level-${level}.json`), JSON.stringify(entry, null, 2));
}
console.log(`  Created ${Object.keys(ritualsByLevel).length} ritual level entries.`);

// ==================== CLANS ====================
console.log("Building clans compendium...");
const clanDir = join(PACKS_DIR, "clans");
mkdirSync(clanDir, { recursive: true });

for (const clan of CLAN_DB) {
  const slug = slugify(clan.name);
  const discList = clan.disciplines.length
    ? `<p><strong>In-Clan Disciplines:</strong> ${clan.disciplines.join(", ")}</p>`
    : `<p><em>No in-clan disciplines.</em></p>`;

  const content = `
    <h2>${clan.name}</h2>
    <p><em>${clan.nickname}</em></p>
    ${discList}
    <h3>Clan Bane</h3>
    <p>${clan.bane}</p>
    <h3>Compulsion</h3>
    <p>${clan.compulsion}</p>
  `;

  const entry = {
    _id: makeId(),
    name: clan.name,
    pages: [{
      _id: makeId(),
      name: clan.name,
      type: "text",
      text: { content, format: 1 },
      sort: 0,
    }],
  };

  writeFileSync(join(clanDir, `${slug}.json`), JSON.stringify(entry, null, 2));
}
console.log(`  Created ${CLAN_DB.length} clan entries.`);

console.log("Done! Compendium packs built.");
