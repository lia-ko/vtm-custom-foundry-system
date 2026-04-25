import { safePrompt } from "../helpers/safe-dialog.mjs";
import { CLAN_DB, getClan } from "../data/clans.mjs";
import { applySharedHandlers, registerSharedListeners } from "./mixins/shared-handlers.mjs";
import * as TrackerHandlers from "./handlers/trackers.mjs";
import * as RollingHandlers from "./handlers/rolling.mjs";
import * as DisciplineHandlers from "./handlers/disciplines.mjs";
import * as RitualHandlers from "./handlers/rituals.mjs";
import * as TraitHandlers from "./handlers/traits.mjs";
import * as InventoryHandlers from "./handlers/inventory.mjs";
import * as XPHandlers from "./handlers/xp.mjs";
import * as HuntingHandlers from "./handlers/hunting.mjs";
import * as ContactHandlers from "./handlers/contacts.mjs";
import * as HumanityHandlers from "./handlers/humanity.mjs";

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
    // Humanity + Stains (stains fill from the right of the empty dots)
    context.humanityDots = Array.from({ length: 10 }, (_, i) => {
      if (i < system.humanity) return "filled";
      if (i >= 10 - system.stains) return "stained";
      return "empty";
    });
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

  // ==================== DATA HELPERS ====================

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

    TrackerHandlers.registerListeners(html, this);
    RollingHandlers.registerListeners(html, this);
    DisciplineHandlers.registerListeners(html, this);
    RitualHandlers.registerListeners(html, this);
    TraitHandlers.registerListeners(html, this);
    InventoryHandlers.registerListeners(html, this);
    XPHandlers.registerListeners(html, this);
    HuntingHandlers.registerListeners(html, this);
    ContactHandlers.registerListeners(html, this);
    HumanityHandlers.registerListeners(html, this);
    registerSharedListeners(html, this);
  }

  // ==================== UTILITY ====================

  async _promptInput(label) {
    return safePrompt({
      title: label,
      content: `<form><div class="form-group"><label>${label}</label><input type="text" name="value" autofocus /></div></form>`,
      callback: html => html.find('[name="value"]').val()?.trim(),
    });
  }

  async _promptNumber(label) {
    return safePrompt({
      title: label,
      content: `<form><div class="form-group"><label>${label}</label><input type="number" name="value" value="100" min="1" autofocus /></div></form>`,
      callback: html => parseInt(html.find('[name="value"]').val()),
    });
  }
}

// Mix handler methods into the prototype
applySharedHandlers(VTMVampireSheet);
const handlerModules = [TrackerHandlers, RollingHandlers, DisciplineHandlers, RitualHandlers, TraitHandlers, InventoryHandlers, XPHandlers, HuntingHandlers, ContactHandlers, HumanityHandlers];
for (const mod of handlerModules) {
  for (const [key, fn] of Object.entries(mod)) {
    if (key === "registerListeners") continue;
    if (typeof fn === "function") {
      VTMVampireSheet.prototype[key] = fn;
    }
  }
}
