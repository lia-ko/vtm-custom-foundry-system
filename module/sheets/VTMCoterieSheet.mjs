import { safePrompt } from "../helpers/safe-dialog.mjs";
import { applySharedHandlers, registerSharedListeners } from "./mixins/shared-handlers.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export default class VTMCoterieSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vtm-custom", "sheet", "actor", "coterie"],
      template: "systems/vtm-custom/templates/actor/coterie-sheet.hbs",
      width: 700,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "domain" }],
      dragDrop: [{ dropSelector: ".member-drop-zone" }],
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    const system = this.actor.system;
    context.system = system;
    context.editable = this.isEditable;

    // Resolve member actor references
    context.memberActors = (system.members || []).map(id => game.actors.get(id)).filter(Boolean);

    // Domain dot arrays
    context.chasseDots = this._dots(system.domain.chasse, 5);
    context.lienDots = this._dots(system.domain.lien, 5);
    context.portillonDots = this._dots(system.domain.portillon, 5);
    context.havenDots = this._dots(system.haven.value, 5);

    // Coterie types for dropdown
    context.coterieTypes = [
      "", "Cerberus", "Champion", "Commando", "Fang", "Maréchal",
      "Nomads", "Plumaire", "Questari", "Regency", "Vehme", "Watchmen",
    ];

    return context;
  }

  _dots(current, max) {
    return Array.from({ length: max }, (_, i) => i < current);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Domain/haven dot clicks
    html.on("click", "[data-coterie-tracker] .dot", this._onDomainDotClick.bind(this));

    // Members
    html.on("click", ".remove-member", this._onRemoveMember.bind(this));

    // Merits/Flaws
    html.on("click", ".add-coterie-merit", this._onAddTrait.bind(this, "merits"));
    html.on("click", ".add-coterie-flaw", this._onAddTrait.bind(this, "flaws"));
    html.on("click", ".delete-coterie-merit", this._onDeleteFromArray.bind(this, "merits"));
    html.on("click", ".delete-coterie-flaw", this._onDeleteFromArray.bind(this, "flaws"));

    // Relationships
    html.on("click", ".add-relationship", this._onAddRelationship.bind(this));
    html.on("click", ".delete-relationship", this._onDeleteFromArray.bind(this, "relationships"));

    // Shared handlers (expand/collapse)
    registerSharedListeners(html, this);
  }

  // ==================== DRAG & DROP (add members) ====================

  /** @override */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Actor") return;

    const actor = await Actor.implementation.fromDropData(data);
    if (!actor || actor.type !== "vampire") {
      ui.notifications.warn("Only vampire characters can be added to a coterie.");
      return;
    }

    const members = foundry.utils.deepClone(this.actor.system.members);
    if (members.includes(actor.id)) {
      ui.notifications.info(`${actor.name} is already in the coterie.`);
      return;
    }

    members.push(actor.id);
    await this.actor.update({ "system.members": members });
  }

  // ==================== HANDLERS ====================

  async _onDomainDotClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const tracker = event.currentTarget.parentElement.dataset.coterieTracker;
    const clickedValue = parseInt(event.currentTarget.dataset.value);
    const path = `system.${tracker}`;
    const current = foundry.utils.getProperty(this.actor, path);
    await this.actor.update({ [path]: current === clickedValue ? clickedValue - 1 : clickedValue });
  }

  async _onRemoveMember(event) {
    event.preventDefault();
    const id = event.currentTarget.dataset.id;
    const members = this.actor.system.members.filter(m => m !== id);
    await this.actor.update({ "system.members": members });
  }

  async _onAddTrait(arrayKey, event) {
    event.preventDefault();
    const label = arrayKey === "merits" ? "Merit" : "Flaw";
    const content = await renderTemplate(`${DIALOG_PATH}/coterie-add-trait.hbs`);
    const result = await safePrompt({
      title: `Add Coterie ${label}`,
      content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return { name, value: parseInt(html.find('[name="rating"]').val()) || 1, description: html.find('[name="desc"]').val() || "" };
      },
    });
    if (!result) return;

    const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
    arr.push(result);
    await this.actor.update({ [`system.${arrayKey}`]: arr });
  }

  async _onAddRelationship(event) {
    event.preventDefault();
    const content = await renderTemplate(`${DIALOG_PATH}/coterie-add-relationship.hbs`);
    const result = await safePrompt({
      title: "Add Relationship",
      content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return {
          name,
          type: html.find('[name="type"]').val(),
          value: parseInt(html.find('[name="rating"]').val()) || 0,
          description: html.find('[name="desc"]').val() || "",
        };
      },
    });
    if (!result) return;

    const arr = foundry.utils.deepClone(this.actor.system.relationships);
    arr.push(result);
    await this.actor.update({ "system.relationships": arr });
  }

}

applySharedHandlers(VTMCoterieSheet);
