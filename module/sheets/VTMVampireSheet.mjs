import { DISCIPLINE_DB, getAvailableDisciplines, getAllPowers } from "../data/disciplines.mjs";
import { RITUAL_DB } from "../data/rituals.mjs";
import { CLAN_DB, getClan } from "../data/clans.mjs";
import { MERITS_FLAWS_DB, getMeritsFlaws } from "../data/merits-flaws.mjs";
import { BACKGROUND_DB, getBackground } from "../data/backgrounds.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export default class VTMVampireSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vtm-custom", "sheet", "actor", "vampire"],
      template: "systems/vtm-custom/templates/actor/vampire-sheet.hbs",
      width: 800,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],
    });
  }

  // ==================== DATA PREPARATION ====================

  /** @override */
  getData() {
    const context = super.getData();
    const system = this.actor.system;
    context.system = system;
    context.editable = this.isEditable;

    // Health
    const healthArr = system.health ?? [0, 0, 0, 0, 0, 0, 0];
    context.healthBoxes = healthArr.map(v => ({
      value: v,
      class: v === 1 ? "superficial" : v === 2 ? "aggravated" : "",
    }));
    context.healthDamaged = healthArr.filter(v => v > 0).length;
    context.healthTotal = healthArr.length;

    // Resource trackers
    context.willpowerBoxes = this._buildTrackerArray(system.willpower.current, system.willpower.max);
    context.hungerDots = this._buildTrackerArray(system.hunger, 5);
    context.humanityDots = this._buildTrackerArray(system.humanity, 10);
    context.bloodPotencyDots = this._buildTrackerArray(system.bloodPotency, 5);

    // Frenzy
    const frenzyMap = {
      fury: { icon: "\u2620", title: "FRENZY", subtitle: "The Beast rages. Attack everything." },
      hunger: { icon: "\u2623", title: "HUNGER FRENZY", subtitle: "The Beast starves. Feed on the nearest vessel." },
      rotschreck: { icon: "\u2622", title: "R\u00D6TSCHRECK", subtitle: "The Red Fear. Flee from the source." },
    };
    context.frenzyInfo = frenzyMap[system.frenzy] || null;

    // Attributes & Skills
    const dotMax = 5;
    context.physicalAttrs = this._buildAttrGroup(["strength", "dexterity", "stamina"], system.attributes, dotMax);
    context.socialAttrs = this._buildAttrGroup(["charisma", "manipulation", "appearance"], system.attributes, dotMax);
    context.mentalAttrs = this._buildAttrGroup(["perception", "intelligence", "wits"], system.attributes, dotMax);
    context.talentsList = this._buildSkillGroup(system.talents, dotMax, "talents");
    context.skillsList = this._buildSkillGroup(system.skills, dotMax, "skills");
    context.knowledgesList = this._buildSkillGroup(system.knowledges, dotMax, "knowledges");

    // Weapons
    context.weaponsList = (system.weapons || []).map((w, i) => {
      const attrVal = system.attributes[w.attribute] ?? 0;
      const skillVal = this._getSkillValue(system, w.skill);
      return { ...w, index: i, attrLabel: this._formatLabel(w.attribute), skillLabel: this._formatLabel(w.skill), pool: attrVal + skillVal };
    });

    // XP
    context.xpRemaining = system.experience.total - system.experience.spent;
    context.xpLogReversed = [...(system.xpLog || [])].reverse();

    // Clan
    context.clanOptions = CLAN_DB.map(c => ({ name: c.name, nickname: c.nickname, selected: system.clan === c.name }));
    context.clanInfo = getClan(system.clan) || null;

    return context;
  }

  _buildTrackerArray(current, max) {
    return Array.from({ length: max }, (_, i) => i < current);
  }

  _buildAttrGroup(keys, attrs, maxDots) {
    return keys.map(key => ({ key, label: this._formatLabel(key), value: attrs[key], dots: this._buildTrackerArray(attrs[key], maxDots) }));
  }

  _buildSkillGroup(skillObj, maxDots, groupName = "") {
    return Object.entries(skillObj).map(([key, value]) => ({ key, label: this._formatLabel(key), value, group: groupName, dots: this._buildTrackerArray(value, maxDots) }));
  }

  _getSkillValue(system, skillKey) {
    return system.talents[skillKey] ?? system.skills[skillKey] ?? system.knowledges[skillKey] ?? 0;
  }

  _formatLabel(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
  }

  /** Build the attribute/skill option arrays used by roll dialogs. */
  _buildRollOptions(preAttr = "", preSkill = "") {
    const system = this.actor.system;
    const attributes = Object.keys(system.attributes).map(k => ({
      key: k, label: this._formatLabel(k), value: system.attributes[k], selected: k === preAttr,
    }));
    const skills = [
      ...Object.entries(system.talents),
      ...Object.entries(system.skills),
      ...Object.entries(system.knowledges),
    ].map(([k, v]) => ({ key: k, label: this._formatLabel(k), value: v, selected: k === preSkill }));
    return { attributes, skills, hunger: system.hunger };
  }

  // ==================== LISTENERS ====================

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Resource trackers
    html.on("click", ".dmg-box", this._onHealthCycle.bind(this));
    html.on("click", "[data-tracker]:not(.dmg-box)", this._onTrackerClick.bind(this));

    // Dot clicks
    html.on("click", ".dot-set .dot", this._onDotClick.bind(this));
    html.on("click", "[data-adv-type] .dot", this._onAdvDotClick.bind(this));

    // Rolling
    html.on("click", ".attr-row.rollable", this._onStatRoll.bind(this));
    html.on("click", ".quick-roll", this._onStatRoll.bind(this));

    // Rouse & Frenzy
    html.on("click", ".rouse-check", this._onRouseCheck.bind(this));
    html.on("click", ".frenzy-check", this._onFrenzyCheck.bind(this));
    html.on("click", ".end-frenzy", this._onEndFrenzy.bind(this));

    // Disciplines
    html.on("click", ".toggle-disc", this._onToggleDisc.bind(this));
    html.on("click", ".disc-dots .dot", this._onDiscDotClick.bind(this));
    html.on("click", ".add-discipline", this._onAddDiscipline.bind(this));
    html.on("click", ".delete-discipline", this._onDeleteDiscipline.bind(this));
    html.on("click", ".power-pin", this._onTogglePowerPin.bind(this));

    // Rituals
    html.on("click", ".add-ritual", this._onAddRitual.bind(this));
    html.on("click", ".add-custom-ritual", this._onAddCustomRitual.bind(this));
    html.on("click", ".delete-ritual", this._onDeleteItem.bind(this, "rituals"));

    // Traits
    html.on("click", ".add-background", this._onAddBackground.bind(this));
    html.on("click", ".delete-background", this._onDeleteItem.bind(this, "backgrounds"));
    html.on("click", ".add-merit", this._onAddMeritFlaw.bind(this, "merit"));
    html.on("click", ".add-flaw", this._onAddMeritFlaw.bind(this, "flaw"));
    html.on("click", ".add-custom-merit", this._onAddCustomMeritFlaw.bind(this, "merit"));
    html.on("click", ".add-custom-flaw", this._onAddCustomMeritFlaw.bind(this, "flaw"));
    html.on("click", ".delete-merit", this._onDeleteItem.bind(this, "merits"));
    html.on("click", ".delete-flaw", this._onDeleteItem.bind(this, "flaws"));

    // Generic expand/collapse
    html.on("click", ".expandable-toggle", this._onToggleDetail.bind(this));

    // Inventory
    html.on("click", ".add-weapon", this._onAddWeapon.bind(this));
    html.on("click", ".delete-weapon", this._onDeleteItem.bind(this, "weapons"));
    html.on("click", ".add-gear", this._onAddGear.bind(this));
    html.on("click", ".delete-gear", this._onDeleteItem.bind(this, "gear"));
    html.on("click", ".adjust-cash", this._onAdjustCash.bind(this));

    // Clan & XP
    html.on("change", ".clan-select", this._onClanChange.bind(this));
    html.on("click", ".xp-add-btn", this._onXpAdd.bind(this));
    html.on("click", ".xp-spend-btn", this._onXpSpend.bind(this));
  }

  // ==================== GENERIC HANDLERS ====================

  _onToggleDetail(event) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget;
    const group = el.dataset.expandGroup;
    const id = el.dataset.expandId;
    const detail = this.element.find(`.expandable-detail[data-expand-group="${group}"][data-expand-id="${id}"]`);
    const isVisible = detail.is(":visible");

    this.element.find(`.expandable-detail[data-expand-group="${group}"]`).hide();
    this.element.find(`.expandable-toggle[data-expand-group="${group}"]`).each(function () {
      this.innerHTML = this.innerHTML.replace("\u25BE", "\u25BA");
    });

    if (!isVisible) {
      detail.show();
      el.innerHTML = el.innerHTML.replace("\u25BA", "\u25BE");
    }
  }

  async _onDeleteItem(arrayKey, event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
    arr.splice(index, 1);
    await this.actor.update({ [`system.${arrayKey}`]: arr });
  }

  // ==================== RESOURCE TRACKERS ====================

  async _onHealthCycle(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const health = foundry.utils.deepClone(this.actor.system.health);
    health[index] = (health[index] + 1) % 3;
    await this.actor.update({ "system.health": health });
  }

  async _onTrackerClick(event) {
    event.preventDefault();
    const tracker = event.currentTarget.dataset.tracker;
    const clickedValue = parseInt(event.currentTarget.dataset.index) + 1;
    const pathMap = { willpower: "system.willpower.current", hunger: "system.hunger", humanity: "system.humanity", bloodPotency: "system.bloodPotency" };
    const currentMap = { willpower: this.actor.system.willpower.current, hunger: this.actor.system.hunger, humanity: this.actor.system.humanity, bloodPotency: this.actor.system.bloodPotency };
    const path = pathMap[tracker];
    if (!path) return;
    const current = currentMap[tracker];
    await this.actor.update({ [path]: current === clickedValue ? clickedValue - 1 : clickedValue });
  }

  async _onDotClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const { group, key, value } = event.currentTarget.dataset;
    const clickedValue = parseInt(value);
    const path = `system.${group}.${key}`;
    const current = foundry.utils.getProperty(this.actor, path);
    await this.actor.update({ [path]: current === clickedValue ? clickedValue - 1 : clickedValue });
  }

  async _onAdvDotClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const { advType, advIndex, value } = event.currentTarget.dataset;
    const clickedValue = parseInt(value);
    const arr = foundry.utils.deepClone(this.actor.system[advType]);
    const current = arr[parseInt(advIndex)].value;
    arr[parseInt(advIndex)].value = current === clickedValue ? clickedValue - 1 : clickedValue;
    await this.actor.update({ [`system.${advType}`]: arr });
  }

  // ==================== ROLLING ====================

  async _onStatRoll(event) {
    if (event.target.closest(".dot-set")) return;
    event.preventDefault();

    const rollType = event.currentTarget.dataset.rollType || "";
    const rollKey = event.currentTarget.dataset.rollKey || "";
    const preAttr = rollType === "attribute" ? rollKey : "";
    const preSkill = rollType === "skill" ? rollKey : "";

    const content = await renderTemplate(`${DIALOG_PATH}/roll-dialog.hbs`, this._buildRollOptions(preAttr, preSkill));

    const result = await Dialog.prompt({
      title: rollKey ? `Roll ${this._formatLabel(rollKey)}` : "Quick Roll",
      content,
      callback: html => ({
        attr: html.find('[name="attr"]').val(),
        skill: html.find('[name="skill"]').val(),
        mod: parseInt(html.find('[name="mod"]').val()) || 0,
        diff: parseInt(html.find('[name="diff"]').val()) || 1,
        hunger: parseInt(html.find('[name="hunger"]').val()) || 0,
      }),
    });
    if (!result) return;

    const system = this.actor.system;
    const pool = Math.max(1, (system.attributes[result.attr] ?? 0) + this._getSkillValue(system, result.skill) + result.mod);
    const { VTMDiceRoller } = await import("../dice/VTMDiceRoller.mjs");
    await VTMDiceRoller.v5Roll({
      pool, hunger: result.hunger, difficulty: result.diff,
      label: `${this._formatLabel(result.attr)} + ${this._formatLabel(result.skill)}`,
      actor: this.actor,
    });
  }

  // ==================== ROUSE CHECK ====================

  async _onRouseCheck(event) {
    event.preventDefault();
    const { VTMDiceRoller } = await import("../dice/VTMDiceRoller.mjs");
    await VTMDiceRoller.rouseCheck({ label: "Rouse Check", count: 1, actor: this.actor });
  }

  // ==================== FRENZY ====================

  async _onFrenzyCheck(event) {
    event.preventDefault();
    const system = this.actor.system;
    const wpThird = Math.max(1, Math.floor(system.humanity / 3));

    const content = await renderTemplate(`${DIALOG_PATH}/frenzy-dialog.hbs`, {
      willpower: system.willpower.current,
      humanityThird: wpThird,
      defaultPool: system.willpower.current + wpThird,
      hungerWarning: system.hunger >= 4,
      hungerLevel: system.hunger,
    });

    const result = await Dialog.prompt({
      title: "Frenzy Check",
      content,
      callback: html => ({
        fType: html.find('[name="fType"]').val(),
        pool: parseInt(html.find('[name="pool"]').val()) || 1,
        diff: parseInt(html.find('[name="diff"]').val()) || 3,
      }),
    });
    if (!result) return;

    const { VTMDiceRoller } = await import("../dice/VTMDiceRoller.mjs");
    const rollResult = await VTMDiceRoller.v5Roll({
      pool: result.pool, hunger: 0, difficulty: result.diff,
      label: `Frenzy Check (${result.fType})`, actor: this.actor,
    });

    if (rollResult.successes < result.diff) {
      await this.actor.update({ "system.frenzy": result.fType });
      ui.notifications.warn(`${this.actor.name} enters ${result.fType} frenzy!`);
    } else {
      ui.notifications.info(`${this.actor.name} resists the Beast.`);
    }
  }

  async _onEndFrenzy(event) {
    event.preventDefault();
    await this.actor.update({ "system.frenzy": "" });
  }

  // ==================== DISCIPLINES ====================

  async _onToggleDisc(event) {
    if (event.target.closest(".disc-dots") || event.target.closest(".disc-delete")) return;
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    discs[index].open = !discs[index].open;
    await this.actor.update({ "system.disciplines": discs });
  }

  async _onDiscDotClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const discIndex = parseInt(event.currentTarget.dataset.discDot);
    const clickedValue = parseInt(event.currentTarget.dataset.value);
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    const disc = discs[discIndex];
    const oldValue = disc.value;
    disc.value = oldValue === clickedValue ? clickedValue - 1 : clickedValue;
    disc.open = true;

    if (disc.value > oldValue) {
      const dbPowers = getAllPowers(disc.name);
      for (let lv = oldValue + 1; lv <= disc.value; lv++) {
        for (const p of dbPowers.filter(p => p.level === lv)) {
          if (!disc.powers.find(ep => ep.name === p.name)) {
            disc.powers.push({ ...p, amalgam: p.amalgam || "", pin: false });
          }
        }
      }
      disc.powers.sort((a, b) => a.level - b.level);
    }

    await this.actor.update({ "system.disciplines": discs });
  }

  async _onAddDiscipline(event) {
    event.preventDefault();
    const owned = this.actor.system.disciplines.map(d => d.name);
    const available = getAvailableDisciplines().filter(d => !owned.includes(d.name));

    if (available.length === 0) {
      const name = await this._promptInput("Discipline Name (custom)");
      if (!name) return;
      const discs = foundry.utils.deepClone(this.actor.system.disciplines);
      discs.push({ name, path: "", icon: "\u2666", value: 0, color: "", open: true, powers: [] });
      await this.actor.update({ "system.disciplines": discs });
      return;
    }

    const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
      label: "Discipline",
      options: available.map(d => ({ value: d.name, label: `${d.icon} ${d.name}` })),
      showRating: false,
    });

    const result = await Dialog.prompt({ title: "Add Discipline", content, callback: html => html.find('[name="selection"]').val() });
    if (!result) return;

    const dbEntry = DISCIPLINE_DB[result];
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    discs.push({ name: result, path: "", icon: dbEntry?.icon || "\u2666", value: 0, color: dbEntry?.color || "", open: true, powers: [] });
    await this.actor.update({ "system.disciplines": discs });
  }

  async _onDeleteDiscipline(event) {
    event.preventDefault();
    event.stopPropagation();
    const index = parseInt(event.currentTarget.dataset.index);
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    discs.splice(index, 1);
    await this.actor.update({ "system.disciplines": discs });
  }

  async _onTogglePowerPin(event) {
    event.preventDefault();
    event.stopPropagation();
    const discIdx = parseInt(event.currentTarget.dataset.disc);
    const powerIdx = parseInt(event.currentTarget.dataset.power);
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    discs[discIdx].powers[powerIdx].pin = !discs[discIdx].powers[powerIdx].pin;
    await this.actor.update({ "system.disciplines": discs });
  }

  // ==================== RITUALS ====================

  async _onAddRitual(event) {
    event.preventDefault();
    const owned = this.actor.system.rituals.map(r => r.name);
    const available = RITUAL_DB.filter(r => !owned.includes(r.name));

    if (available.length === 0) { ui.notifications.info("All rituals already learned."); return; }

    const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
      label: "Ritual",
      options: available.map(r => ({ value: r.name, label: `Lvl ${r.level} — ${r.name}` })),
      showRating: false,
    });

    const result = await Dialog.prompt({ title: "Add Ritual", content, callback: html => html.find('[name="selection"]').val() });
    if (!result) return;

    const dbEntry = available.find(r => r.name === result);
    if (!dbEntry) return;

    const rituals = foundry.utils.deepClone(this.actor.system.rituals);
    rituals.push({ ...dbEntry, custom: false });
    rituals.sort((a, b) => a.level - b.level);
    await this.actor.update({ "system.rituals": rituals });
  }

  async _onAddCustomRitual(event) {
    event.preventDefault();
    const content = await renderTemplate(`${DIALOG_PATH}/custom-ritual.hbs`);
    const result = await Dialog.prompt({
      title: "Add Custom Ritual",
      content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return { name, level: parseInt(html.find('[name="level"]').val()), description: html.find('[name="desc"]').val() || "", cost: html.find('[name="cost"]').val() || "1 Rouse", pool: html.find('[name="pool"]').val() || "Int + Blood Sorcery", ingredients: html.find('[name="ingredients"]').val() || "", time: html.find('[name="time"]').val() || "", custom: true };
      },
    });
    if (!result) return;

    const rituals = foundry.utils.deepClone(this.actor.system.rituals);
    rituals.push(result);
    rituals.sort((a, b) => a.level - b.level);
    await this.actor.update({ "system.rituals": rituals });
  }

  // ==================== CLAN ====================

  async _onClanChange(event) {
    event.preventDefault();
    const newClan = event.currentTarget.value;
    const clanData = getClan(newClan);

    if (!clanData || !clanData.disciplines.length) {
      await this.actor.update({ "system.clan": newClan });
      return;
    }

    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    const ownedNames = discs.map(d => d.name);

    for (const discName of clanData.disciplines) {
      if (ownedNames.includes(discName)) continue;
      const dbEntry = DISCIPLINE_DB[discName];
      discs.push({ name: discName, path: "", icon: dbEntry?.icon || "\u2666", value: 0, color: dbEntry?.color || "", open: true, powers: [] });
    }

    await this.actor.update({ "system.clan": newClan, "system.disciplines": discs });
  }

  // ==================== TRAITS ====================

  async _onAddBackground(event) {
    event.preventDefault();
    const owned = this.actor.system.backgrounds.map(b => b.name);
    const available = BACKGROUND_DB.filter(b => !owned.includes(b.name));

    if (available.length === 0) {
      const name = await this._promptInput("Background Name (custom)");
      if (!name) return;
      const bgs = foundry.utils.deepClone(this.actor.system.backgrounds);
      bgs.push({ name, value: 1, description: "" });
      await this.actor.update({ "system.backgrounds": bgs });
      return;
    }

    const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
      label: "Background",
      options: available.map(b => ({ value: b.name, label: `${b.name} (${b.min}-${b.max} dots)` })),
      showRating: true,
    });

    const result = await Dialog.prompt({
      title: "Add Background", content,
      callback: html => ({ name: html.find('[name="selection"]').val(), rating: parseInt(html.find('[name="rating"]').val()) || 1 }),
    });
    if (!result) return;

    const dbEntry = available.find(b => b.name === result.name);
    const bgs = foundry.utils.deepClone(this.actor.system.backgrounds);
    bgs.push({ name: result.name, value: Math.clamp(result.rating, dbEntry?.min || 1, dbEntry?.max || 5), description: dbEntry?.description || "" });
    await this.actor.update({ "system.backgrounds": bgs });
  }

  async _onAddMeritFlaw(type, event) {
    event.preventDefault();
    const arrayKey = type === "merit" ? "merits" : "flaws";
    const owned = this.actor.system[arrayKey].map(m => m.name);
    const available = getMeritsFlaws(type).filter(mf => !owned.includes(mf.name));

    if (available.length === 0) { ui.notifications.info(`All ${type}s already added.`); return; }

    const content = await renderTemplate(`${DIALOG_PATH}/add-from-list.hbs`, {
      label: type === "merit" ? "Merit" : "Flaw",
      options: available.map(mf => ({ value: mf.name, label: `[${mf.category}] ${mf.name} (${mf.min}-${mf.max} dots)` })),
      showRating: true,
    });

    const result = await Dialog.prompt({
      title: `Add ${type === "merit" ? "Merit" : "Flaw"}`, content,
      callback: html => ({ name: html.find('[name="selection"]').val(), rating: parseInt(html.find('[name="rating"]').val()) || 1 }),
    });
    if (!result) return;

    const dbEntry = available.find(mf => mf.name === result.name);
    if (!dbEntry) return;

    const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
    arr.push({ name: dbEntry.name, value: Math.clamp(result.rating, dbEntry.min, dbEntry.max), category: dbEntry.category, description: dbEntry.description });
    await this.actor.update({ [`system.${arrayKey}`]: arr });
  }

  async _onAddCustomMeritFlaw(type, event) {
    event.preventDefault();
    const arrayKey = type === "merit" ? "merits" : "flaws";
    const content = await renderTemplate(`${DIALOG_PATH}/custom-merit-flaw.hbs`);

    const result = await Dialog.prompt({
      title: `Add Custom ${type === "merit" ? "Merit" : "Flaw"}`, content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return { name, value: parseInt(html.find('[name="rating"]').val()) || 1, category: html.find('[name="category"]').val() || "Custom", description: html.find('[name="desc"]').val() || "" };
      },
    });
    if (!result) return;

    const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
    arr.push(result);
    await this.actor.update({ [`system.${arrayKey}`]: arr });
  }

  // ==================== INVENTORY ====================

  async _onAddWeapon(event) {
    event.preventDefault();
    const name = await this._promptInput("Weapon Name");
    if (!name) return;
    const weapons = foundry.utils.deepClone(this.actor.system.weapons);
    weapons.push({ name, type: "Melee", attribute: "dexterity", skill: "melee" });
    await this.actor.update({ "system.weapons": weapons });
  }

  async _onAddGear(event) {
    event.preventDefault();
    const name = await this._promptInput("Gear Name");
    if (!name) return;
    const gear = foundry.utils.deepClone(this.actor.system.gear);
    gear.push({ name, description: "" });
    await this.actor.update({ "system.gear": gear });
  }

  async _onAdjustCash(event) {
    event.preventDefault();
    const mode = event.currentTarget.dataset.mode;
    const amount = await this._promptNumber(mode === "add" ? "Amount to add" : "Amount to spend");
    if (!amount || amount <= 0) return;
    const current = this.actor.system.currency.cash;
    await this.actor.update({ "system.currency.cash": mode === "add" ? current + amount : Math.max(0, current - amount) });
  }

  // ==================== XP ====================

  async _onXpAdd(event) {
    event.preventDefault();
    const content = await renderTemplate(`${DIALOG_PATH}/xp-dialog.hbs`, { placeholder: "e.g. Session 12 reward" });
    const result = await Dialog.prompt({
      title: "Add XP", content,
      callback: html => ({ amount: parseInt(html.find('[name="amount"]').val()) || 0, reason: html.find('[name="reason"]').val() || "Added" }),
    });
    if (!result || result.amount <= 0) return;

    const log = foundry.utils.deepClone(this.actor.system.xpLog);
    log.push({ type: "add", amount: result.amount, reason: result.reason });
    await this.actor.update({ "system.experience.total": this.actor.system.experience.total + result.amount, "system.xpLog": log });
  }

  async _onXpSpend(event) {
    event.preventDefault();
    const content = await renderTemplate(`${DIALOG_PATH}/xp-dialog.hbs`, { placeholder: "e.g. Occult 4 -> 5" });
    const result = await Dialog.prompt({
      title: "Spend XP", content,
      callback: html => ({ amount: parseInt(html.find('[name="amount"]').val()) || 0, reason: html.find('[name="reason"]').val() || "Spent" }),
    });
    if (!result || result.amount <= 0) return;

    const remaining = this.actor.system.experience.total - this.actor.system.experience.spent;
    if (result.amount > remaining) { ui.notifications.warn("Not enough XP available."); return; }

    const log = foundry.utils.deepClone(this.actor.system.xpLog);
    log.push({ type: "spend", amount: result.amount, reason: result.reason });
    await this.actor.update({ "system.experience.spent": this.actor.system.experience.spent + result.amount, "system.xpLog": log });
  }

  // ==================== UTILITY ====================

  async _promptInput(label) {
    return Dialog.prompt({
      title: label,
      content: `<form><div class="form-group"><label>${label}</label><input type="text" name="value" autofocus /></div></form>`,
      callback: html => html.find('[name="value"]').val()?.trim(),
    });
  }

  async _promptNumber(label) {
    return Dialog.prompt({
      title: label,
      content: `<form><div class="form-group"><label>${label}</label><input type="number" name="value" value="100" min="1" autofocus /></div></form>`,
      callback: html => parseInt(html.find('[name="value"]').val()),
    });
  }
}
