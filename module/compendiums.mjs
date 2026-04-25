/**
 * Populate reference journal entries from the system's JSON data.
 * Creates journal entries in a "VTM Reference" folder on first run.
 * Only runs if the entries don't exist yet (checks by folder name).
 */

import { DISCIPLINE_DB } from "./data/disciplines.mjs";
import { RITUAL_DB } from "./data/rituals.mjs";
import { CLAN_DB } from "./data/clans.mjs";

const FOLDER_NAME = "VTM Reference";

export async function populateReferenceJournals() {
  // Only GMs can create journal entries
  if (!game.user.isGM) return;

  // Check if already populated
  const existing = game.folders.find(f => f.name === FOLDER_NAME && f.type === "JournalEntry");
  if (existing) return;

  console.log("vtm-custom | Populating reference journals...");

  // Create the folder
  const folder = await Folder.create({ name: FOLDER_NAME, type: "JournalEntry", color: "#8b1a1a" });

  // Create discipline journals
  for (const [discName, discData] of Object.entries(DISCIPLINE_DB)) {
    const powersHtml = discData.powers.map(p => {
      const amalgamLine = p.amalgam ? `<p><strong>Amalgam:</strong> ${p.amalgam}</p>` : "";
      return `<h3>Level ${p.level}: ${p.name}</h3><p><strong>Cost:</strong> ${p.cost} | <strong>Pool:</strong> ${p.pool} | <strong>Type:</strong> ${p.type === "cb" ? "Combat" : p.type === "ri" ? "Passive" : "Utility"}</p>${amalgamLine}<p>${p.description}</p><hr>`;
    }).join("");

    await JournalEntry.create({
      name: `Discipline: ${discName}`,
      folder: folder.id,
      pages: [{ name: discName, type: "text", text: { content: `<h2>${discData.icon} ${discName}</h2>${powersHtml}` } }],
    });
  }

  // Create ritual journals by level
  const ritualsByLevel = {};
  for (const r of RITUAL_DB) {
    if (!ritualsByLevel[r.level]) ritualsByLevel[r.level] = [];
    ritualsByLevel[r.level].push(r);
  }

  for (const [level, rituals] of Object.entries(ritualsByLevel)) {
    const html = rituals.map(r =>
      `<h3>${r.name}</h3><p><strong>Cost:</strong> ${r.cost} | <strong>Pool:</strong> ${r.pool} | <strong>Time:</strong> ${r.time}</p><p><strong>Ingredients:</strong> ${r.ingredients}</p><p>${r.description}</p><hr>`
    ).join("");

    await JournalEntry.create({
      name: `Rituals: Level ${level}`,
      folder: folder.id,
      pages: [{ name: `Level ${level} Rituals`, type: "text", text: { content: `<h2>Blood Sorcery Rituals — Level ${level}</h2>${html}` } }],
    });
  }

  // Create clan journals
  for (const clan of CLAN_DB) {
    const discList = clan.disciplines.length
      ? `<p><strong>In-Clan Disciplines:</strong> ${clan.disciplines.join(", ")}</p>`
      : `<p><em>No in-clan disciplines.</em></p>`;

    await JournalEntry.create({
      name: `Clan: ${clan.name}`,
      folder: folder.id,
      pages: [{ name: clan.name, type: "text", text: { content: `<h2>${clan.name}</h2><p><em>${clan.nickname}</em></p>${discList}<h3>Clan Bane</h3><p>${clan.bane}</p><h3>Compulsion</h3><p>${clan.compulsion}</p>` } }],
    });
  }

  console.log("vtm-custom | Reference journals created.");
  ui.notifications.info("VTM Reference journals have been created. Check the Journal sidebar.");
}
