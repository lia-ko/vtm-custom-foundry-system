/**
 * VTM V5 Blood Sorcery Rituals Database
 *
 * Each ritual contains:
 *   name        - ritual name
 *   level       - level (1-5)
 *   description - full description of the ritual's effect
 *   cost        - rouse check cost to perform
 *   pool        - dice pool for casting
 *   ingredients - required components
 *   time        - casting time
 */

export const RITUAL_DB = [

  // ============================================================
  // LEVEL 1
  // ============================================================
  {
    name: "Blood Walk",
    level: 1,
    description: "By tasting the blood of another Kindred, the caster can determine their generation, clan, sire, and any blood bonds. Provides a vision of the subject's lineage.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A taste of the subject's blood",
    time: "1 hour",
  },
  {
    name: "Clinging of the Insect",
    level: 1,
    description: "Allows the caster to climb and cling to walls and ceilings like a spider for the remainder of the night.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A living spider, consumed",
    time: "10 minutes",
  },
  {
    name: "Craft Bloodstone",
    level: 1,
    description: "Enchants a small pebble to glow when within a certain distance of Kindred vitae. Useful for detecting vampires or hidden blood stores.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A small smooth pebble and a point of vitae",
    time: "3 hours",
  },
  {
    name: "Wake with Evening's Freshness",
    level: 1,
    description: "Allows the caster to awaken at any sign of danger during the day without the need for a Humanity roll, rising one hour before sunset if undisturbed.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "The caster's vitae spread around the resting place",
    time: "15 minutes",
  },
  {
    name: "Communicate with Kindred Sire",
    level: 1,
    description: "Opens a telepathic channel between the caster and their sire, allowing communication over any distance for a single night. Both parties must be willing.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "An object once belonging to the sire",
    time: "30 minutes",
  },
  {
    name: "Defence of the Sacred Haven",
    level: 1,
    description: "Wards a single room against sunlight. Any windows or openings are mystically sealed against daylight, though the room becomes pitch black. Lasts until the next sunset.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Vitae painted along all window frames and door thresholds",
    time: "1 hour",
  },

  // ============================================================
  // LEVEL 2
  // ============================================================
  {
    name: "Warding Circle vs Ghouls",
    level: 2,
    description: "Creates an invisible circle on the ground that no ghoul can willingly cross. Ghouls who attempt to cross suffer aggravated damage. Lasts until the next sunrise.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Vitae traced in a circle, salt",
    time: "30 minutes",
  },
  {
    name: "Deflection of Wooden Doom",
    level: 2,
    description: "Enchants the caster's body so that the first wooden stake that strikes them during the night shatters harmlessly on contact. Single use per casting.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Wood shavings dissolved in vitae, consumed",
    time: "1 hour",
  },
  {
    name: "Extinguish",
    level: 2,
    description: "Instantly douses all mundane fires within a certain radius. Supernatural fires resist but are reduced. Useful against frenzy triggers.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A vial of water mixed with ash",
    time: "Instant (1 turn ritual action)",
  },
  {
    name: "Eyes of Babel",
    level: 2,
    description: "Allows the caster to understand and speak any human language for the remainder of the night. Does not grant literacy.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A page from a foreign language text, burned and mixed with vitae",
    time: "30 minutes",
  },
  {
    name: "Illuminate the Trail of Prey",
    level: 2,
    description: "By casting this ritual over an object belonging to a person, the caster can see ghostly footprints tracing the owner's recent path. Tracks last until sunrise.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A personal possession of the target",
    time: "15 minutes",
  },
  {
    name: "Truth of Blood",
    level: 2,
    description: "By anointing a subject's lips with vitae, the caster compels them to speak only the truth for the next few minutes. Supernaturals may resist.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery vs Composure + Subterfuge",
    ingredients: "A drop of vitae applied to the subject's lips",
    time: "5 minutes",
  },

  // ============================================================
  // LEVEL 3
  // ============================================================
  {
    name: "Warding Circle vs Kindred",
    level: 3,
    description: "Creates an invisible circle that no vampire can willingly cross. Kindred who force their way through suffer aggravated damage. Lasts until sunrise.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Vitae of the caster traced in a circle, bone dust",
    time: "1 hour",
  },
  {
    name: "Firewalker",
    level: 3,
    description: "Grants the caster resistance to fire for the remainder of the night. Fire damage is reduced and Rotschreck difficulties are lowered.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A candle flame extinguished with vitae",
    time: "30 minutes",
  },
  {
    name: "Incorporeal Passage",
    level: 3,
    description: "Allows the caster to pass through a single solid barrier — wall, door, or floor — as though it were not there. One passage per casting.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A shard of mirror smeared with vitae",
    time: "10 minutes",
  },
  {
    name: "Pavis of Foul Presence",
    level: 3,
    description: "Wards the caster against Presence powers. Any Presence attempt directed at the caster is reflected back upon the user for the remainder of the scene.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Vitae painted on the caster's forehead (invisible to mortals)",
    time: "20 minutes",
  },
  {
    name: "Shaft of Belated Quiescence",
    level: 3,
    description: "Enchants a wooden stake so that it splinters inside the target on impact, releasing a paralytic blood magic effect. Even if the heart is missed, the target is immobilized for a time.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A wooden stake soaked in vitae for three nights",
    time: "3 nights preparation + 10 minutes casting",
  },

  // ============================================================
  // LEVEL 4
  // ============================================================
  {
    name: "Warding Circle vs Spirits",
    level: 4,
    description: "Creates an invisible circle that no spirit, ghost, or wraith can cross. Spirits who attempt to breach it suffer damage and are repelled. Lasts until sunrise.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Salt, iron filings, and vitae traced in a circle",
    time: "1 hour",
  },
  {
    name: "Heart of Stone",
    level: 4,
    description: "The caster mystically transforms their heart to stone, rendering them immune to staking. Emotions are dulled and social interactions suffer, but the caster is protected from the most feared Kindred vulnerability.",
    cost: "2 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A carved stone replica of a heart, vitae",
    time: "4 hours",
  },
  {
    name: "Bone of Lies",
    level: 4,
    description: "Enchants a mortal bone so that whoever holds it cannot speak a deliberate lie. The holder is compelled toward truth, though they may remain silent. The bone blackens slightly with each lie it prevents.",
    cost: "1 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A mortal bone (finger bone or rib), soaked in vitae",
    time: "3 hours",
  },
  {
    name: "Splinter Servant",
    level: 4,
    description: "Animates a wooden stake to fly toward a designated target and attempt to stake them in the heart. The stake acts with a dice pool determined by the caster's ritual successes.",
    cost: "2 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A sharpened stake, vitae, a strand of the target's hair",
    time: "2 hours",
  },

  // ============================================================
  // LEVEL 5
  // ============================================================
  {
    name: "Escape to a True Friend",
    level: 5,
    description: "In a moment of dire need, the caster is instantly transported to the location of a person they consider a true friend. The caster vanishes and reappears beside this ally, regardless of distance. Can only be used once per lunar cycle.",
    cost: "2 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A lock of hair and a drop of blood from both the caster and the friend, a circle of candles",
    time: "3 hours preparation; instant activation",
  },
  {
    name: "Blood Contract",
    level: 5,
    description: "Creates a mystically binding contract written in vitae. All parties who sign suffer aggravated damage and a curse if they break the terms. The contract burns to ash if fulfilled or if all parties are destroyed.",
    cost: "2 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "Vellum made from the skin of an animal sacrificed under a new moon, vitae from all parties",
    time: "6 hours",
  },
  {
    name: "Summon the Departed",
    level: 5,
    description: "Conjures the ghost of a deceased mortal or destroyed Kindred. The spirit is compelled to answer questions honestly for a number of minutes equal to the caster's successes. The spirit may be hostile.",
    cost: "3 Rouse",
    pool: "Int + Blood Sorcery",
    ingredients: "A personal possession of the deceased, graveyard dirt, vitae, black candles",
    time: "2 hours",
  },
];

/**
 * Get rituals filtered by level.
 * @param {number} level - Ritual level (1-5), or 0 for all
 * @returns {Array}
 */
export function getRitualsByLevel(level = 0) {
  if (level === 0) return RITUAL_DB;
  return RITUAL_DB.filter(r => r.level === level);
}

/**
 * Get all ritual names for filtering already-owned.
 * @returns {string[]}
 */
export function getAllRitualNames() {
  return RITUAL_DB.map(r => r.name);
}
