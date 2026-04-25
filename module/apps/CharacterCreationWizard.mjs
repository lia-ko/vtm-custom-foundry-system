import { safePrompt } from "../helpers/safe-dialog.mjs";
import { CLAN_DB, getClan } from "../data/clans.mjs";
import { DISCIPLINE_DB, getAvailableDisciplines } from "../data/disciplines.mjs";
import { PREDATOR_TYPES } from "../data/predator-types.mjs";
import { MERITS_FLAWS_DB, getMeritsFlaws } from "../data/merits-flaws.mjs";
import { BACKGROUND_DB } from "../data/backgrounds.mjs";

/**
 * V5 Character Creation Wizard
 * Multi-step guided character creation following V5 rules.
 */
export default class CharacterCreationWizard extends Application {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.step = 1;
    this.totalSteps = 7;

    // Working data (accumulated across steps, written to actor at the end)
    this.charData = {
      name: actor.name || "",
      clan: "",
      generation: "13th",
      sire: "",
      concept: "",

      // Attributes: base 1 each, distribute 4/3/2 across categories
      attributes: {
        strength: 1, dexterity: 1, stamina: 1,
        charisma: 1, manipulation: 1, appearance: 1,
        perception: 1, intelligence: 1, wits: 1,
      },
      attrPriority: { physical: 0, social: 0, mental: 0 }, // 4, 3, or 2

      // Skills: 1 at 3, 8 at 2, 10 at 1 — tracked as flat object
      talents: {}, skills: {}, knowledges: {},
      skillPoints: { threes: 1, twos: 8, ones: 10 },

      // Disciplines: 2 dots among in-clan
      disciplines: [],
      discDotsRemaining: 2,

      // Predator type
      predatorType: null,

      // Advantages: 7 merit dots, 2 flaw dots
      merits: [],
      flaws: [],
      backgrounds: [],
      meritDotsRemaining: 7,
      flawDotsRemaining: 2,

      // Final
      humanity: 7,
      willpower: { max: 0, current: 0 },
      bloodPotency: 1,
    };
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "vtm-character-wizard",
      title: "Character Creation",
      template: "systems/vtm-custom/templates/apps/wizard.hbs",
      width: 650,
      height: 650,
      classes: ["vtm-custom", "wizard"],
      resizable: true,
    });
  }

  getData() {
    return {
      step: this.step,
      totalSteps: this.totalSteps,
      data: this.charData,
      clans: CLAN_DB,
      clanInfo: getClan(this.charData.clan),
      predatorTypes: PREDATOR_TYPES,
      selectedPredator: this.charData.predatorType ? PREDATOR_TYPES.find(p => p.name === this.charData.predatorType) : null,
      availableMerits: getMeritsFlaws("merit"),
      availableFlaws: getMeritsFlaws("flaw"),
      backgrounds: BACKGROUND_DB,
      disciplineDB: DISCIPLINE_DB,
      attrCategories: this._getAttrCategories(),
    };
  }

  _getAttrCategories() {
    const a = this.charData.attributes;
    return {
      physical: { label: "Physical", keys: ["strength", "dexterity", "stamina"], total: a.strength + a.dexterity + a.stamina - 3 },
      social: { label: "Social", keys: ["charisma", "manipulation", "appearance"], total: a.charisma + a.manipulation + a.appearance - 3 },
      mental: { label: "Mental", keys: ["perception", "intelligence", "wits"], total: a.perception + a.intelligence + a.wits - 3 },
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", ".wizard-next", this._onNext.bind(this));
    html.on("click", ".wizard-back", this._onBack.bind(this));
    html.on("click", ".wizard-finish", this._onFinish.bind(this));
    html.on("change", "input, select", this._onFieldChange.bind(this));
    html.on("click", ".wizard-dot", this._onWizardDot.bind(this));
    html.on("click", ".wizard-add-merit", this._onAddMerit.bind(this));
    html.on("click", ".wizard-add-flaw", this._onAddFlaw.bind(this));
    html.on("click", ".wizard-add-bg", this._onAddBackground.bind(this));
    html.on("click", ".wizard-remove-item", this._onRemoveItem.bind(this));
    html.on("click", ".wizard-predator", this._onSelectPredator.bind(this));
    html.on("click", ".wizard-disc-dot", this._onDiscDot.bind(this));
  }

  // ==================== NAVIGATION ====================

  _onNext(event) {
    event.preventDefault();
    const validation = this._validateStep();
    if (!validation.valid) {
      ui.notifications.warn(validation.message);
      return;
    }
    if (this.step < this.totalSteps) {
      // Auto-compute derived values when moving to step 7
      if (this.step === 6) this._computeFinal();
      this.step++;
      this.render();
    }
  }

  _onBack(event) {
    event.preventDefault();
    if (this.step > 1) { this.step--; this.render(); }
  }

  async _onFinish(event) {
    event.preventDefault();
    const validation = this._validateStep();
    if (!validation.valid) {
      ui.notifications.warn(validation.message);
      return;
    }
    await this._applyToActor();
    this.close();
    ui.notifications.info(`${this.charData.name} has been created!`);
  }

  // ==================== FIELD CHANGES ====================

  _onFieldChange(event) {
    const el = event.currentTarget;
    const field = el.name;
    const value = el.type === "number" ? parseInt(el.value) || 0 : el.value;

    if (field === "clan") {
      this.charData.clan = value;
      // Auto-populate disciplines from clan
      const clan = getClan(value);
      if (clan) {
        this.charData.disciplines = clan.disciplines.map(name => {
          const db = DISCIPLINE_DB[name];
          return { name, icon: db?.icon || "\u2666", color: db?.color || "", value: 0, powers: [] };
        });
      }
      this.charData.discDotsRemaining = 2;
      this.render();
    } else if (field.startsWith("attr.")) {
      const key = field.split(".")[1];
      this.charData.attributes[key] = Math.clamp(value, 1, 5);
      this.render();
    } else if (field === "name") {
      this.charData.name = value;
    } else if (field === "generation") {
      this.charData.generation = value;
    } else if (field === "sire") {
      this.charData.sire = value;
    } else if (field === "concept") {
      this.charData.concept = value;
    } else if (field === "humanity") {
      this.charData.humanity = Math.clamp(value, 1, 10);
      this.render();
    } else if (field === "bloodPotency") {
      this.charData.bloodPotency = Math.clamp(value, 0, 2);
      this.render();
    }
  }

  _onWizardDot(event) {
    event.preventDefault();
    const { group, key } = event.currentTarget.dataset;
    const value = parseInt(event.currentTarget.dataset.value);

    if (group === "attr") {
      const current = this.charData.attributes[key];
      this.charData.attributes[key] = current === value ? value - 1 : value;
      // Enforce minimum 1
      if (this.charData.attributes[key] < 1) this.charData.attributes[key] = 1;
      this.render();
    } else if (["talents", "skills", "knowledges"].includes(group)) {
      const current = this.charData[group][key] || 0;
      const newVal = current === value ? value - 1 : value;
      if (newVal < 0) return;
      this.charData[group][key] = newVal;
      this.render();
    }
  }

  _onDiscDot(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.disc);
    const value = parseInt(event.currentTarget.dataset.value);
    const disc = this.charData.disciplines[index];
    if (!disc) return;

    const oldValue = disc.value;
    const newValue = oldValue === value ? value - 1 : value;
    if (newValue < 0 || newValue > 2) return;

    // Check total dots used
    const totalUsed = this.charData.disciplines.reduce((s, d, i) => s + (i === index ? newValue : d.value), 0);
    if (totalUsed > 2) {
      ui.notifications.warn("Only 2 discipline dots to distribute.");
      return;
    }

    disc.value = newValue;
    this.charData.discDotsRemaining = 2 - totalUsed;
    this.render();
  }

  _onSelectPredator(event) {
    event.preventDefault();
    const name = event.currentTarget.dataset.predator;
    this.charData.predatorType = name;
    this.render();
  }

  // ==================== ADVANTAGES ====================

  async _onAddMerit(event) { await this._addAdvantage(event, "merits", "Merit", getMeritsFlaws("merit"), "meritDotsRemaining"); }
  async _onAddFlaw(event) { await this._addAdvantage(event, "flaws", "Flaw", getMeritsFlaws("flaw"), "flawDotsRemaining"); }
  async _onAddBackground(event) { await this._addAdvantage(event, "backgrounds", "Background", BACKGROUND_DB, "meritDotsRemaining"); }

  async _addAdvantage(event, listKey, label, sourceDB, poolKey) {
    event.preventDefault();
    if (this.charData[poolKey] <= 0) {
      ui.notifications.warn(`No ${label.toLowerCase()} dots remaining.`);
      return;
    }
    const owned = this.charData[listKey].map(i => i.name);
    const available = sourceDB.filter(i => !owned.includes(i.name));
    if (!available.length) return;

    const content = await renderTemplate("systems/vtm-custom/templates/dialogs/add-from-list.hbs", {
      label,
      options: available.map(i => ({ value: i.name, label: `${i.category ? `[${i.category}] ` : ""}${i.name} (${i.min}-${i.max})` })),
      showRating: true,
    });

    const result = await safePrompt({
      title: `Add ${label}`, content,
      callback: html => ({ name: html.find('[name="selection"]').val(), rating: parseInt(html.find('[name="rating"]').val()) || 1 }),
    });
    if (!result) return;

    const db = available.find(i => i.name === result.name);
    const dots = Math.clamp(result.rating, db.min, Math.min(db.max, this.charData[poolKey]));
    this.charData[listKey].push({ name: db.name, value: dots, category: db.category || "", description: db.description });
    this.charData[poolKey] -= dots;
    this.render();
  }

  _onRemoveItem(event) {
    event.preventDefault();
    const { list, index } = event.currentTarget.dataset;
    const idx = parseInt(index);
    const item = this.charData[list][idx];
    if (!item) return;

    if (list === "merits" || list === "backgrounds") {
      this.charData.meritDotsRemaining += item.value;
    } else if (list === "flaws") {
      this.charData.flawDotsRemaining += item.value;
    }
    this.charData[list].splice(idx, 1);
    this.render();
  }

  // ==================== VALIDATION ====================

  _validateStep() {
    switch (this.step) {
      case 1: {
        if (!this.charData.name.trim()) return { valid: false, message: "Enter a character name." };
        if (!this.charData.clan) return { valid: false, message: "Select a clan." };
        return { valid: true };
      }
      case 2: {
        const cats = this._getAttrCategories();
        const totals = [cats.physical.total, cats.social.total, cats.mental.total].sort((a, b) => b - a);
        if (totals[0] !== 4 || totals[1] !== 3 || totals[2] !== 2) {
          return { valid: false, message: `Distribute 4/3/2 bonus dots across categories. Current: Physical ${cats.physical.total}, Social ${cats.social.total}, Mental ${cats.mental.total}.` };
        }
        return { valid: true };
      }
      case 3: {
        const allSkills = { ...this.charData.talents, ...this.charData.skills, ...this.charData.knowledges };
        const values = Object.values(allSkills).filter(v => v > 0);
        const threes = values.filter(v => v === 3).length;
        const twos = values.filter(v => v === 2).length;
        const ones = values.filter(v => v === 1).length;
        if (threes !== 1 || twos !== 8 || ones !== 10) {
          return { valid: false, message: `Skills must be: 1 at 3 dots, 8 at 2 dots, 10 at 1 dot. Current: ${threes}x3, ${twos}x2, ${ones}x1.` };
        }
        return { valid: true };
      }
      case 4: {
        const totalDisc = this.charData.disciplines.reduce((s, d) => s + d.value, 0);
        if (totalDisc !== 2) return { valid: false, message: `Distribute exactly 2 discipline dots. Current: ${totalDisc}.` };
        return { valid: true };
      }
      case 5: {
        if (!this.charData.predatorType) return { valid: false, message: "Select a predator type." };
        return { valid: true };
      }
      case 6:
      case 7:
        return { valid: true };
      default:
        return { valid: true };
    }
  }

  // ==================== FINALIZE ====================

  _computeFinal() {
    // Willpower: user sets manually on step 7 (our system uses classic 9 attrs, not V5 Composure/Resolve)
    if (!this.charData.willpower.max) this.charData.willpower.max = 3;
    this.charData.willpower.current = this.charData.willpower.max;

    // Humanity: base 7, modified by predator type
    const pred = PREDATOR_TYPES.find(p => p.name === this.charData.predatorType);
    if (pred) {
      this.charData.humanity = Math.clamp(7 + (pred.humanityMod || 0), 1, 10);
    }
  }

  async _applyToActor() {
    const d = this.charData;
    const pred = PREDATOR_TYPES.find(p => p.name === d.predatorType);

    // Apply predator type bonuses to skills
    const talents = { alertness: 0, athletics: 0, awareness: 0, brawl: 0, empathy: 0, expression: 0, intimidation: 0, leadership: 0, streetwise: 0, subterfuge: 0, ...d.talents };
    const skills = { animalKen: 0, crafts: 0, drive: 0, etiquette: 0, firearms: 0, larceny: 0, melee: 0, performance: 0, stealth: 0, survival: 0, ...d.skills };
    const knowledges = { academics: 0, computer: 0, finance: 0, investigation: 0, law: 0, medicine: 0, occult: 0, politics: 0, science: 0, technology: 0, ...d.knowledges };

    if (pred) {
      const bonus1 = pred.skillBonus;
      if (bonus1) {
        const group = { talents, skills, knowledges }[bonus1.group];
        if (group) group[bonus1.key] = Math.min(5, (group[bonus1.key] || 0) + bonus1.dots);
      }
      const bonus2 = pred.secondSkillBonus;
      if (bonus2) {
        const group = { talents, skills, knowledges }[bonus2.group];
        if (group) group[bonus2.key] = Math.min(5, (group[bonus2.key] || 0) + bonus2.dots);
      }
    }

    // Build merits/flaws including predator type additions
    const merits = [...d.merits];
    const flaws = [...d.flaws];
    if (pred?.merit) merits.push(pred.merit);
    if (pred?.flaw) flaws.push(pred.flaw);

    // Build disciplines — add predator discipline dot
    const disciplines = d.disciplines.map(disc => ({
      name: disc.name, path: "", icon: disc.icon, value: disc.value,
      color: disc.color, open: true, powers: [],
    }));

    // Predator type may grant a discipline dot
    if (pred?.disciplineOptions?.length) {
      const predDiscName = pred.disciplineOptions[0]; // Default to first option
      const existing = disciplines.find(disc => disc.name === predDiscName);
      if (existing) {
        existing.value = Math.min(5, existing.value + 1);
      } else {
        const db = DISCIPLINE_DB[predDiscName];
        disciplines.push({
          name: predDiscName, path: "", icon: db?.icon || "\u2666",
          value: 1, color: db?.color || "", open: true, powers: [],
        });
      }
    }

    const updateData = {
      name: d.name,
      "system.clan": d.clan,
      "system.generation": d.generation,
      "system.sire": d.sire,
      "system.concept": d.concept,
      "system.attributes": d.attributes,
      "system.talents": talents,
      "system.skills": skills,
      "system.knowledges": knowledges,
      "system.disciplines": disciplines,
      "system.merits": merits,
      "system.flaws": flaws,
      "system.backgrounds": d.backgrounds,
      "system.humanity": d.humanity,
      "system.willpower": d.willpower,
      "system.bloodPotency": d.bloodPotency,
      "system.hunger": 1,
    };

    await this.actor.update(updateData);
  }
}
