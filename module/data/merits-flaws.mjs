/**
 * VTM V5 Merits & Flaws Database
 *
 * Each entry contains:
 *   name        - name
 *   type        - "merit" or "flaw"
 *   category    - category (Physical, Mental, Social, Supernatural, Feeding, Mythical, Thin-Blood)
 *   min         - minimum dot rating
 *   max         - maximum dot rating
 *   description - full description with mechanical effects
 */

export const MERITS_FLAWS_DB = [

  // ============================================================
  // PHYSICAL MERITS
  // ============================================================
  { name: "Beautiful", type: "merit", category: "Physical", min: 2, max: 2,
    description: "You are strikingly attractive. Add 1 die to Social pools when your appearance is relevant (seduction, first impressions, persuasion). People remember your face — this can be a Masquerade risk." },
  { name: "Stunning", type: "merit", category: "Physical", min: 4, max: 4,
    description: "You are breathtakingly gorgeous, the kind of beauty that stops conversations. Add 2 dice to Social pools when appearance matters. However, you are extremely memorable — Stealth and anonymity suffer a 1-die penalty when interacting with anyone who has seen your face." },
  { name: "Iron Gullet", type: "merit", category: "Physical", min: 3, max: 3,
    description: "You can feed on cold or rancid blood (bagged blood, corpses dead less than a day) without penalty. Most vampires find such blood revolting and must roll Stamina + Resolve to keep it down. You slake Hunger normally from these sources." },
  { name: "Cat-like Balance", type: "merit", category: "Physical", min: 3, max: 3,
    description: "You have an exceptional sense of balance. Add 2 dice to any Dexterity rolls involving balance, climbing, or acrobatic movement. You can walk narrow ledges and slippery surfaces without rolling under normal circumstances." },

  // ============================================================
  // PHYSICAL FLAWS
  // ============================================================
  { name: "Ugly", type: "flaw", category: "Physical", min: 1, max: 1,
    description: "You are notably unattractive, though not supernaturally so (unlike the Nosferatu bane). Subtract 1 die from Social pools where appearance is a factor. This is separate from and stacks with any clan bane." },
  { name: "Repulsive", type: "flaw", category: "Physical", min: 2, max: 2,
    description: "You are deeply unpleasant to look at — scars, deformities, or just an inherently disturbing visage. Subtract 2 dice from Social pools involving appearance. Mortals are uncomfortable around you and may avoid eye contact." },
  { name: "Lame", type: "flaw", category: "Physical", min: 3, max: 3,
    description: "One of your legs is damaged or withered. Your movement speed is halved, and all running/chasing rolls suffer a 2-die penalty. This cannot be healed by vampiric mending — the damage is part of your undead body." },
  { name: "Fourteenth Generation", type: "flaw", category: "Physical", min: 2, max: 2,
    description: "You are of the 14th generation. Your Blood Potency can never exceed 0. You can Blood Surge but the bonus is only 1 die. Your blood is thin enough that Blood Sorcery rituals targeting you are at -2 difficulty." },

  // ============================================================
  // MENTAL MERITS
  // ============================================================
  { name: "Coldly Logical", type: "merit", category: "Mental", min: 1, max: 1,
    description: "You have a knack for suppressing emotional reactions. Once per session, you may re-roll a failed Composure or Resolve roll by approaching the situation with pure logic." },
  { name: "Eidetic Memory", type: "merit", category: "Mental", min: 3, max: 3,
    description: "You remember everything you have seen, heard, or read with perfect clarity. You never need to roll Intelligence to recall information you have been exposed to. The Storyteller may share details from previous sessions that your character would remember but the player might not." },
  { name: "Iron Will", type: "merit", category: "Mental", min: 3, max: 3,
    description: "Your will is exceptionally strong. Add 2 dice to all Resolve rolls to resist supernatural mental influence (Dominate, Presence, Blood Bond compulsions). This stacks with Fortitude's Unswayable Mind." },
  { name: "Light Sleeper", type: "merit", category: "Mental", min: 1, max: 1,
    description: "You awaken instantly at any sign of danger during the day, without needing to roll Humanity. You still suffer the usual daytime dice penalties, but you are never caught unaware." },

  // ============================================================
  // MENTAL FLAWS
  // ============================================================
  { name: "Nightmares", type: "flaw", category: "Mental", min: 1, max: 1,
    description: "You suffer from vivid, recurring nightmares during daysleep. Each night upon waking, roll Willpower (Difficulty 2). On failure, start the night with 1 Superficial Willpower damage from exhausting, unrestful sleep." },
  { name: "Prey Exclusion", type: "flaw", category: "Mental", min: 1, max: 1,
    description: "You refuse to feed on a certain type of mortal (children, the elderly, the homeless, members of your former faith, etc.). If you accidentally feed on an excluded target, you must roll Humanity or suffer a Stain." },
  { name: "Paranoia", type: "flaw", category: "Mental", min: 2, max: 2,
    description: "You are convinced that others are plotting against you. All Social rolls involving trust, delegation, or cooperation suffer a 1-die penalty. The Storyteller may occasionally feed you false information that your character believes is a threat." },
  { name: "Obsessive Compulsion", type: "flaw", category: "Mental", min: 2, max: 2,
    description: "You have a compulsive behavior (counting, hand-washing, ordering objects, checking locks). In stressful situations, you must roll Composure (Difficulty 3) or spend a turn performing your compulsion instead of acting. This is separate from clan compulsions." },

  // ============================================================
  // SOCIAL MERITS
  // ============================================================
  // ============================================================
  // SOCIAL FLAWS
  // ============================================================
  { name: "Enemy", type: "flaw", category: "Social", min: 1, max: 5,
    description: "Someone powerful wants you dead, ruined, or enslaved. The dots represent the enemy's power and resources. 1 = a single mortal hunter or rival neonate. 3 = a Primogen or small hunter cell. 5 = an Archon, Methuselah, or major organization like the Second Inquisition. The enemy acts against you periodically — the Storyteller determines when and how." },
  { name: "Suspect", type: "flaw", category: "Social", min: 1, max: 1,
    description: "The Second Inquisition or another mortal agency has flagged you as a person of interest. Your phone may be tapped, your movements tracked, and your associates watched. Using technology carelessly may expose you. Leaving digital traces is dangerous." },
  { name: "Shunned", type: "flaw", category: "Social", min: 2, max: 2,
    description: "You are an outcast in Kindred society. Other vampires avoid associating with you publicly. You cannot claim domain or feeding grounds, and Elysium hosts may refuse you entry. Social rolls with Kindred who know your reputation suffer a 2-die penalty." },
  { name: "Dark Secret", type: "flaw", category: "Social", min: 1, max: 3,
    description: "You harbor a dangerous secret — Diablerie, Sabbat ties, a mortal identity, or a forbidden relationship. The dots represent how damaging the secret would be if revealed. 1 = embarrassing. 2 = politically damaging. 3 = grounds for a blood hunt. Someone may be close to discovering the truth." },

  // ============================================================
  // SUPERNATURAL MERITS
  // ============================================================
  { name: "Unbondable", type: "merit", category: "Supernatural", min: 5, max: 5,
    description: "You cannot be Blood Bonded. Drinking another vampire's blood creates no emotional attachment or compulsion. This is extremely rare and politically valuable — a Prince cannot bind your loyalty, but they also cannot trust you. Some Kindred will see this as a threat." },
  { name: "Eat Food", type: "merit", category: "Supernatural", min: 2, max: 2,
    description: "You can consume and digest mortal food and drink without vomiting. The food provides no nourishment, but you can eat at restaurants, drink at bars, and share meals with mortals — invaluable for maintaining a mortal cover. Most vampires vomit immediately upon eating solid food." },
  { name: "Bloodhound", type: "merit", category: "Supernatural", min: 1, max: 1,
    description: "You can smell blood at a distance. Detect the presence of vitae (mortal or Kindred) within 20 meters by scent alone. You can also determine blood resonance by smell without tasting. Useful for hunting and detecting hidden vampires." },

  // ============================================================
  // SUPERNATURAL FLAWS
  // ============================================================
  { name: "Beacon of the Unholy", type: "flaw", category: "Supernatural", min: 2, max: 2,
    description: "Holy symbols, consecrated ground, and True Faith affect you more strongly than other vampires. The difficulty to resist True Faith is increased by 2 for you. You feel physical discomfort in churches and near devout mortals, and holy water burns like acid instead of merely stinging." },
  { name: "Stigmata", type: "flaw", category: "Supernatural", min: 2, max: 2,
    description: "When you reach Hunger 4 or higher, you bleed from your palms, feet, and forehead. The blood is real vitae — it stains clothing, leaves traces, and can be tasted by others. This is an obvious Masquerade breach and impossible to fully conceal." },
  { name: "Organovore", type: "flaw", category: "Supernatural", min: 2, max: 2,
    description: "You must consume flesh as well as blood to reduce Hunger. When feeding, you must eat a portion of the victim's body — organs, muscle, or skin. This makes feeding messier, slower, and more likely to kill the victim. Animal flesh does not suffice; it must be human." },

  // ============================================================
  // FEEDING MERITS
  // ============================================================
  { name: "Farmer", type: "merit", category: "Feeding", min: 2, max: 2,
    description: "You feed exclusively from willing vessels who know what you are and consent. This reduces Stain risks from feeding but limits your options — in emergencies, you may struggle to find a willing source. Your herd (if any) consists entirely of informed, consenting blood dolls." },
  { name: "Sandman", type: "merit", category: "Feeding", min: 1, max: 1,
    description: "You feed from sleeping victims without waking them. Gain 2 bonus dice to Stealth rolls when approaching a sleeping target. The victim wakes with no memory of the feeding and attributes any marks to insect bites or skin irritation." },

  // ============================================================
  // FEEDING FLAWS
  // ============================================================
  { name: "Farmer (Flaw)", type: "flaw", category: "Feeding", min: 2, max: 2,
    description: "You are emotionally incapable of feeding from unwilling victims. If you feed without clear consent, you immediately gain a Stain regardless of circumstances. This makes emergency feeding in combat or survival situations deeply traumatic." },
  { name: "Vegan", type: "flaw", category: "Feeding", min: 2, max: 2,
    description: "You feed only from animals. Human blood tastes repulsive to you and you must roll Composure + Resolve (Difficulty 3) to keep it down. Your Hunger can never drop below 1 from animal blood alone." },

  // ============================================================
  // THIN-BLOOD MERITS
  // ============================================================
  { name: "Lifelike", type: "merit", category: "Thin-Blood", min: 1, max: 1,
    description: "You appear fully alive — warm skin, a heartbeat, flushed complexion, and the ability to eat food. You can pass medical examinations as human. This makes maintaining a mortal life trivially easy but may cause other Kindred to underestimate or despise you." },
  { name: "Thin-Blood Resilience", type: "merit", category: "Thin-Blood", min: 1, max: 1,
    description: "You can walk in dim sunlight (overcast days, dawn/dusk) for up to one hour without taking damage. Direct, bright sunlight still burns. This is an extraordinary advantage but marks you as a thin-blood to any Kindred who witnesses it." },

  // ============================================================
  // THIN-BLOOD FLAWS
  // ============================================================
  { name: "Dead Flesh", type: "flaw", category: "Thin-Blood", min: 1, max: 1,
    description: "Unlike most thin-bloods, your body is fully dead — cold skin, no heartbeat, no breathing. You cannot pass as human without Obfuscate or very careful preparation. This is the default state for full-blooded Kindred but unusual and stigmatizing for a thin-blood." },
  { name: "Bestial Temper", type: "flaw", category: "Thin-Blood", min: 2, max: 2,
    description: "Despite your thin blood, your Beast is strong. You suffer frenzy checks as a normal vampire rather than at the reduced frequency thin-bloods usually enjoy. Hunger frenzy is a real danger for you." },

  // ============================================================
  // MYTHICAL MERITS & FLAWS
  // ============================================================
  { name: "Lucky", type: "merit", category: "Mythical", min: 3, max: 3,
    description: "Once per session, you may re-roll all dice in a single failed roll. You must accept the second result. This represents an inexplicable streak of fortune that baffles even other Kindred." },
  { name: "Rugged", type: "merit", category: "Mythical", min: 2, max: 2,
    description: "You heal faster than other vampires. When mending damage, you recover 1 additional Superficial Health level per Rouse check spent on healing. This does not affect Aggravated damage." },
  { name: "Cursed", type: "flaw", category: "Mythical", min: 1, max: 5,
    description: "You suffer from a supernatural curse — anything from minor bad luck (1 dot) to a devastating hex that actively ruins your plans (5 dots). The Storyteller determines the specific manifestation, which should match the dot rating in severity. The curse cannot be lifted by mundane means." },
];

/**
 * Get merits or flaws filtered by type and/or category.
 * @param {string} type - "merit" or "flaw" or null for all
 * @param {string} cat - category name or null for all
 * @returns {Array}
 */
export function getMeritsFlaws(type = null, cat = null) {
  return MERITS_FLAWS_DB.filter(mf =>
    (type === null || mf.type === type) &&
    (cat === null || mf.category === cat)
  );
}

/**
 * Get all unique categories.
 * @returns {string[]}
 */
export function getCategories() {
  return [...new Set(MERITS_FLAWS_DB.map(mf => mf.category))];
}
