import { DISCIPLINE_DB, getAvailableDisciplines, getAllPowers } from "../data/disciplines.mjs";
import { RITUAL_DB } from "../data/rituals.mjs";

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

  /** @override */
  getData() {
    const context = super.getData();
    const system = this.actor.system;
    context.system = system;
    context.editable = this.isEditable;

    // --- V5 Health damage boxes ---
    const healthArr = system.health ?? [0, 0, 0, 0, 0, 0, 0];
    context.healthBoxes = healthArr.map((v, i) => ({
      value: v,
      class: v === 1 ? "superficial" : v === 2 ? "aggravated" : "",
    }));
    context.healthDamaged = healthArr.filter(v => v > 0).length;
    context.healthTotal = healthArr.length;

    // --- Other resource trackers ---
    context.willpowerBoxes = this._buildTrackerArray(system.willpower.current, system.willpower.max);
    context.hungerDots = this._buildTrackerArray(system.hunger, 5);
    context.humanityDots = this._buildTrackerArray(system.humanity, 10);
    context.bloodPotencyDots = this._buildTrackerArray(system.bloodPotency, 5);

    // --- Frenzy info ---
    const frenzyMap = {
      fury: { icon: "\u2620", title: "FRENZY", subtitle: "The Beast rages. Attack everything." },
      hunger: { icon: "\u2623", title: "HUNGER FRENZY", subtitle: "The Beast starves. Feed on the nearest vessel." },
      rotschreck: { icon: "\u2622", title: "R\u00D6TSCHRECK", subtitle: "The Red Fear. Flee from the source." },
    };
    context.frenzyInfo = frenzyMap[system.frenzy] || null;

    // --- Attributes (3 columns) ---
    const attrMax = 5;
    context.physicalAttrs = this._buildAttrGroup(["strength", "dexterity", "stamina"], system.attributes, attrMax);
    context.socialAttrs = this._buildAttrGroup(["charisma", "manipulation", "appearance"], system.attributes, attrMax);
    context.mentalAttrs = this._buildAttrGroup(["perception", "intelligence", "wits"], system.attributes, attrMax);

    // --- Skills (3 columns) ---
    const skillMax = 5;
    context.talentsList = this._buildSkillGroup(system.talents, skillMax);
    context.skillsList = this._buildSkillGroup(system.skills, skillMax);
    context.knowledgesList = this._buildSkillGroup(system.knowledges, skillMax);

    // --- Weapons with computed pools ---
    context.weaponsList = (system.weapons || []).map((w, i) => {
      const attrVal = system.attributes[w.attribute] ?? 0;
      const skillVal = this._getSkillValue(system, w.skill);
      return {
        ...w,
        index: i,
        attrLabel: this._formatLabel(w.attribute),
        skillLabel: this._formatLabel(w.skill),
        pool: attrVal + skillVal,
      };
    });

    // --- XP ---
    context.xpRemaining = system.experience.total - system.experience.spent;
    context.xpLogReversed = [...(system.xpLog || [])].reverse();

    return context;
  }

  // --- Helpers for getData ---

  _buildTrackerArray(current, max) {
    return Array.from({ length: max }, (_, i) => i < current);
  }

  _buildAttrGroup(keys, attrs, maxDots) {
    return keys.map(key => ({
      key,
      label: this._formatLabel(key),
      value: attrs[key],
      dots: this._buildTrackerArray(attrs[key], maxDots),
    }));
  }

  _buildSkillGroup(skillObj, maxDots) {
    return Object.entries(skillObj).map(([key, value]) => ({
      key,
      label: this._formatLabel(key),
      value,
      dots: this._buildTrackerArray(value, maxDots),
    }));
  }

  _getSkillValue(system, skillKey) {
    if (system.talents[skillKey] !== undefined) return system.talents[skillKey];
    if (system.skills[skillKey] !== undefined) return system.skills[skillKey];
    if (system.knowledges[skillKey] !== undefined) return system.knowledges[skillKey];
    return 0;
  }

  _formatLabel(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // --- V5 Health damage cycling ---
    html.on("click", ".dmg-box", this._onHealthCycle.bind(this));

    // --- Other resource bar trackers ---
    html.on("click", "[data-tracker]:not(.dmg-box)", this._onTrackerClick.bind(this));

    // --- Attribute/skill dot clicks ---
    html.on("click", ".dot-set .dot", this._onDotClick.bind(this));

    // --- Frenzy ---
    html.on("click", ".frenzy-check", this._onFrenzyCheck.bind(this));
    html.on("click", ".end-frenzy", this._onEndFrenzy.bind(this));

    // --- Quick roll ---
    html.on("click", ".quick-roll", this._onQuickRoll.bind(this));

    // --- Discipline management ---
    html.on("click", ".toggle-disc", this._onToggleDisc.bind(this));
    html.on("click", ".disc-dots .dot", this._onDiscDotClick.bind(this));
    html.on("click", ".add-discipline", this._onAddDiscipline.bind(this));
    html.on("click", ".delete-discipline", this._onDeleteDiscipline.bind(this));
    html.on("click", ".power-pin", this._onTogglePowerPin.bind(this));
    html.on("click", ".power-toggle", this._onTogglePowerDetail.bind(this));

    // --- Rituals ---
    html.on("click", ".add-ritual", this._onAddRitual.bind(this));
    html.on("click", ".add-custom-ritual", this._onAddCustomRitual.bind(this));
    html.on("click", ".delete-ritual", this._onDeleteItem.bind(this, "rituals"));
    html.on("click", ".ritual-toggle", this._onToggleRitualDetail.bind(this));

    // --- Inventory ---
    html.on("click", ".add-weapon", this._onAddWeapon.bind(this));
    html.on("click", ".delete-weapon", this._onDeleteItem.bind(this, "weapons"));
    html.on("click", ".add-gear", this._onAddGear.bind(this));
    html.on("click", ".delete-gear", this._onDeleteItem.bind(this, "gear"));
    html.on("click", ".adjust-cash", this._onAdjustCash.bind(this));

    // --- XP ---
    html.on("click", ".xp-add-btn", this._onXpAdd.bind(this));
    html.on("click", ".xp-spend-btn", this._onXpSpend.bind(this));
  }

  // ==================== EVENT HANDLERS ====================

  /** V5 health: cycle empty(0) -> superficial(1) -> aggravated(2) -> empty(0) */
  async _onHealthCycle(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const health = foundry.utils.deepClone(this.actor.system.health);
    health[index] = (health[index] + 1) % 3;
    await this.actor.update({ "system.health": health });
  }

  async _onTrackerClick(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const tracker = el.dataset.tracker;
    const clickedValue = parseInt(el.dataset.index) + 1;

    const pathMap = {
      willpower: "system.willpower.current",
      hunger: "system.hunger",
      humanity: "system.humanity",
      bloodPotency: "system.bloodPotency",
    };

    const currentMap = {
      willpower: this.actor.system.willpower.current,
      hunger: this.actor.system.hunger,
      humanity: this.actor.system.humanity,
      bloodPotency: this.actor.system.bloodPotency,
    };

    const path = pathMap[tracker];
    if (!path) return;
    const current = currentMap[tracker];
    const newValue = current === clickedValue ? clickedValue - 1 : clickedValue;
    await this.actor.update({ [path]: newValue });
  }

  async _onDotClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget;
    const group = el.dataset.group;
    const key = el.dataset.key;
    const clickedValue = parseInt(el.dataset.value);

    const path = `system.${group}.${key}`;
    const current = foundry.utils.getProperty(this.actor, path);
    const newValue = current === clickedValue ? clickedValue - 1 : clickedValue;
    await this.actor.update({ [path]: newValue });
  }

  // --- Frenzy ---

  async _onFrenzyCheck(event) {
    event.preventDefault();
    const system = this.actor.system;
    const wpThird = Math.max(1, Math.floor(system.humanity / 3));
    const defaultPool = system.willpower.current + wpThird;

    const content = `
      <form>
        <div class="form-group">
          <label>Frenzy Type</label>
          <select name="fType">
            <option value="fury">Fury — rage, provocation</option>
            <option value="hunger">Hunger — scent of blood</option>
            <option value="rotschreck">R\u00F6tschreck — fire, sunlight</option>
          </select>
        </div>
        <div class="form-group">
          <label>Pool (WP ${system.willpower.current} + Humanity/3 ${wpThird})</label>
          <input type="number" name="pool" value="${defaultPool}" min="1" max="20" />
        </div>
        <div class="form-group">
          <label>Difficulty (successes needed)</label>
          <select name="diff">
            <option value="2">2 — mild provocation</option>
            <option value="3" selected>3 — standard</option>
            <option value="4">4 — severe</option>
            <option value="5">5 — extreme</option>
          </select>
        </div>
        ${system.hunger >= 4 ? '<p style="color:#ff2222;font-size:11px">Warning: Hunger is ' + system.hunger + ' — the Beast is starving</p>' : ''}
      </form>
    `;

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

    // Roll the frenzy check using V5 rules
    const { VTMDiceRoller } = await import("../dice/VTMDiceRoller.mjs");
    const rollResult = await VTMDiceRoller.v5Roll({
      pool: result.pool,
      hunger: 0, // Frenzy checks don't use hunger dice
      difficulty: result.diff,
      label: `Frenzy Check (${result.fType})`,
      actor: this.actor,
    });

    // If failed, set frenzy state
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

  // --- Quick Roll ---

  async _onQuickRoll(event) {
    event.preventDefault();
    const system = this.actor.system;

    // Build attribute and skill option lists
    const attrKeys = Object.keys(system.attributes);
    const allSkillKeys = [
      ...Object.keys(system.talents),
      ...Object.keys(system.skills),
      ...Object.keys(system.knowledges),
    ];

    const attrOptions = attrKeys.map(k =>
      `<option value="${k}">${this._formatLabel(k)} (${system.attributes[k]})</option>`
    ).join("");

    const skillOptions = allSkillKeys.map(k => {
      const v = this._getSkillValue(system, k);
      return `<option value="${k}">${this._formatLabel(k)} (${v})</option>`;
    }).join("");

    const content = `
      <form>
        <div class="form-group"><label>Attribute</label><select name="attr">${attrOptions}</select></div>
        <div class="form-group"><label>Skill</label><select name="skill">${skillOptions}</select></div>
        <div class="form-group"><label>Modifier</label><input type="number" name="mod" value="0" /></div>
        <div class="form-group"><label>Difficulty (successes needed)</label><input type="number" name="diff" value="1" min="1" /></div>
        <div class="form-group"><label>Hunger dice</label><input type="number" name="hunger" value="${system.hunger}" min="0" max="5" /></div>
      </form>
    `;

    const result = await Dialog.prompt({
      title: "Quick Roll",
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

    const attrVal = system.attributes[result.attr] ?? 0;
    const skillVal = this._getSkillValue(system, result.skill);
    const pool = Math.max(1, attrVal + skillVal + result.mod);

    const { VTMDiceRoller } = await import("../dice/VTMDiceRoller.mjs");
    await VTMDiceRoller.v5Roll({
      pool,
      hunger: result.hunger,
      difficulty: result.diff,
      label: `${this._formatLabel(result.attr)} + ${this._formatLabel(result.skill)}`,
      actor: this.actor,
    });
  }

  // --- Disciplines ---

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
    const el = event.currentTarget;
    const discIndex = parseInt(el.dataset.discDot);
    const clickedValue = parseInt(el.dataset.value);
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    const disc = discs[discIndex];
    const oldValue = disc.value;
    disc.value = oldValue === clickedValue ? clickedValue - 1 : clickedValue;
    disc.open = true;

    // Auto-add new powers when dots increase
    if (disc.value > oldValue) {
      const dbPowers = getAllPowers(disc.name);
      for (let lv = oldValue + 1; lv <= disc.value; lv++) {
        const newPowers = dbPowers.filter(p => p.l === lv);
        for (const p of newPowers) {
          if (!disc.powers.find(ep => ep.name === p.n)) {
            disc.powers.push({
              name: p.n, level: p.l, description: p.desc,
              cost: p.cost, pool: p.pool, type: p.type,
              amalgam: p.amalgam || "", pin: false,
            });
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
      // Fallback: allow custom name
      const name = await this._promptInput("Discipline Name (custom)");
      if (!name) return;
      const discs = foundry.utils.deepClone(this.actor.system.disciplines);
      discs.push({ name, path: "", icon: "\u2666", value: 0, color: "", open: true, powers: [] });
      await this.actor.update({ "system.disciplines": discs });
      return;
    }

    const options = available.map(d =>
      `<option value="${d.name}">${d.icon} ${d.name}</option>`
    ).join("");

    const content = `
      <form>
        <div class="form-group">
          <label>Discipline</label>
          <select name="disc">${options}</select>
        </div>
      </form>
    `;

    const result = await Dialog.prompt({
      title: "Add Discipline",
      content,
      callback: html => html.find('[name="disc"]').val(),
    });

    if (!result) return;

    const dbEntry = DISCIPLINE_DB[result];
    const discs = foundry.utils.deepClone(this.actor.system.disciplines);
    discs.push({
      name: result,
      path: "",
      icon: dbEntry?.icon || "\u2666",
      value: 0,
      color: dbEntry?.color || "",
      open: true,
      powers: [],
    });
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

  _onTogglePowerDetail(event) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget;
    const discIdx = el.dataset.disc;
    const powerIdx = el.dataset.power;
    const detail = this.element.find(`.power-detail[data-disc="${discIdx}"][data-power="${powerIdx}"]`);
    const isVisible = detail.is(":visible");

    // Collapse all other details in this discipline
    this.element.find(`.power-detail[data-disc="${discIdx}"]`).hide();
    // Reset all arrows in this discipline to collapsed ►
    this.element.find(`.power-toggle[data-disc="${discIdx}"]`).each(function () {
      this.innerHTML = this.innerHTML.replace("\u25BE", "\u25BA");
    });

    if (!isVisible) {
      detail.show();
      // Change arrow to expanded ▾
      el.innerHTML = el.innerHTML.replace("\u25BA", "\u25BE");
    }
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

  // --- Rituals ---

  _onToggleRitualDetail(event) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget;
    const idx = el.dataset.index;
    const detail = this.element.find(`.ritual-detail[data-index="${idx}"]`);
    const isVisible = detail.is(":visible");

    // Collapse all ritual details
    this.element.find(".ritual-detail").hide();
    this.element.find(".ritual-toggle").each(function () {
      this.innerHTML = this.innerHTML.replace("\u25BE", "\u25BA");
    });

    if (!isVisible) {
      detail.show();
      el.innerHTML = el.innerHTML.replace("\u25BA", "\u25BE");
    }
  }

  async _onAddRitual(event) {
    event.preventDefault();
    const owned = this.actor.system.rituals.map(r => r.name);
    const available = RITUAL_DB.filter(r => !owned.includes(r.n));

    if (available.length === 0) {
      ui.notifications.info("All rituals already learned.");
      return;
    }

    const options = available.map(r =>
      `<option value="${r.n}">Lvl ${r.l} — ${r.n}</option>`
    ).join("");

    const content = `
      <form>
        <div class="form-group">
          <label>Ritual</label>
          <select name="ritual">${options}</select>
        </div>
      </form>
    `;

    const result = await Dialog.prompt({
      title: "Add Ritual",
      content,
      callback: html => html.find('[name="ritual"]').val(),
    });

    if (!result) return;

    const dbEntry = available.find(r => r.n === result);
    if (!dbEntry) return;

    const rituals = foundry.utils.deepClone(this.actor.system.rituals);
    rituals.push({
      name: dbEntry.n,
      level: dbEntry.l,
      description: dbEntry.desc,
      cost: dbEntry.cost,
      pool: dbEntry.pool,
      ingredients: dbEntry.ingredients,
      time: dbEntry.time,
      custom: false,
    });
    rituals.sort((a, b) => a.level - b.level);
    await this.actor.update({ "system.rituals": rituals });
  }

  async _onAddCustomRitual(event) {
    event.preventDefault();
    const content = `
      <form>
        <div class="form-group"><label>Name</label><input type="text" name="name" autofocus /></div>
        <div class="form-group"><label>Level</label><select name="level">
          <option value="1">Level 1</option><option value="2">Level 2</option>
          <option value="3">Level 3</option><option value="4">Level 4</option>
          <option value="5">Level 5</option>
        </select></div>
        <div class="form-group"><label>Description</label><textarea name="desc" rows="3"></textarea></div>
        <div class="form-group"><label>Cost</label><input type="text" name="cost" value="1 Rouse" /></div>
        <div class="form-group"><label>Pool</label><input type="text" name="pool" value="Int + Blood Sorcery" /></div>
        <div class="form-group"><label>Ingredients</label><input type="text" name="ingredients" /></div>
        <div class="form-group"><label>Casting Time</label><input type="text" name="time" /></div>
      </form>
    `;

    const result = await Dialog.prompt({
      title: "Add Custom Ritual",
      content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return {
          name,
          level: parseInt(html.find('[name="level"]').val()),
          description: html.find('[name="desc"]').val() || "",
          cost: html.find('[name="cost"]').val() || "1 Rouse",
          pool: html.find('[name="pool"]').val() || "Int + Blood Sorcery",
          ingredients: html.find('[name="ingredients"]').val() || "",
          time: html.find('[name="time"]').val() || "",
          custom: true,
        };
      },
    });

    if (!result) return;
    const rituals = foundry.utils.deepClone(this.actor.system.rituals);
    rituals.push(result);
    rituals.sort((a, b) => a.level - b.level);
    await this.actor.update({ "system.rituals": rituals });
  }

  async _onDeleteItem(arrayKey, event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
    arr.splice(index, 1);
    await this.actor.update({ [`system.${arrayKey}`]: arr });
  }

  // --- Inventory ---

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
    const newCash = mode === "add" ? current + amount : Math.max(0, current - amount);
    await this.actor.update({ "system.currency.cash": newCash });
  }

  // --- XP ---

  async _onXpAdd(event) {
    event.preventDefault();
    const content = `
      <form>
        <div class="form-group"><label>Amount</label><input type="number" name="amount" value="5" min="1" /></div>
        <div class="form-group"><label>Reason</label><input type="text" name="reason" placeholder="e.g. Session 12 reward" /></div>
      </form>
    `;
    const result = await Dialog.prompt({
      title: "Add XP",
      content,
      callback: html => ({
        amount: parseInt(html.find('[name="amount"]').val()) || 0,
        reason: html.find('[name="reason"]').val() || "Added",
      }),
    });
    if (!result || result.amount <= 0) return;
    const log = foundry.utils.deepClone(this.actor.system.xpLog);
    log.push({ type: "add", amount: result.amount, reason: result.reason });
    await this.actor.update({
      "system.experience.total": this.actor.system.experience.total + result.amount,
      "system.xpLog": log,
    });
  }

  async _onXpSpend(event) {
    event.preventDefault();
    const content = `
      <form>
        <div class="form-group"><label>Amount</label><input type="number" name="amount" value="5" min="1" /></div>
        <div class="form-group"><label>Reason</label><input type="text" name="reason" placeholder="e.g. Occult 4 -> 5" /></div>
      </form>
    `;
    const result = await Dialog.prompt({
      title: "Spend XP",
      content,
      callback: html => ({
        amount: parseInt(html.find('[name="amount"]').val()) || 0,
        reason: html.find('[name="reason"]').val() || "Spent",
      }),
    });
    if (!result || result.amount <= 0) return;
    const remaining = this.actor.system.experience.total - this.actor.system.experience.spent;
    if (result.amount > remaining) {
      ui.notifications.warn("Not enough XP available.");
      return;
    }
    const log = foundry.utils.deepClone(this.actor.system.xpLog);
    log.push({ type: "spend", amount: result.amount, reason: result.reason });
    await this.actor.update({
      "system.experience.spent": this.actor.system.experience.spent + result.amount,
      "system.xpLog": log,
    });
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
