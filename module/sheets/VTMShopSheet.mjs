import { safePrompt, safeConfirm } from "../helpers/safe-dialog.mjs";
import { SHOP_CATALOG } from "../data/shop.mjs";
import { applySharedHandlers } from "./mixins/shared-handlers.mjs";

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export default class VTMShopSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["vtm-custom", "sheet", "actor", "shop"],
      template: "systems/vtm-custom/templates/actor/shop-sheet.hbs",
      width: 650,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "weapons" }],
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    context.system = this.actor.system;
    context.isGM = game.user.isGM;
    context.editable = this.isEditable;
    context.playerCharacters = game.actors.filter(a => a.type === "vampire" && a.hasPlayerOwner);
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", ".shop-buy-weapon", this._onBuyWeapon.bind(this));
    html.on("click", ".shop-buy-gear", this._onBuyGear.bind(this));
    if (!this.isEditable) return;
    html.on("click", ".shop-add-weapon", this._onAddWeapon.bind(this));
    html.on("click", ".shop-add-gear", this._onAddGear.bind(this));
    html.on("click", ".shop-delete-weapon", this._onDeleteFromArray.bind(this, "weapons"));
    html.on("click", ".shop-delete-gear", this._onDeleteFromArray.bind(this, "gear"));
    html.on("click", ".shop-import-catalog", this._onImportCatalog.bind(this));
  }

  // ==================== BUYING ====================

  async _onBuyWeapon(event) {
    event.preventDefault();
    await this._executePurchase(this.actor.system.weapons[parseInt(event.currentTarget.dataset.index)], "weapon", parseInt(event.currentTarget.dataset.index));
  }

  async _onBuyGear(event) {
    event.preventDefault();
    await this._executePurchase(this.actor.system.gear[parseInt(event.currentTarget.dataset.index)], "gear", parseInt(event.currentTarget.dataset.index));
  }

  async _executePurchase(item, itemType, shopIndex) {
    if (!item) return;
    const characters = game.actors.filter(a => a.type === "vampire" && a.isOwner);
    if (characters.length === 0) {
      ui.notifications.warn("No vampire characters available to purchase for.");
      return;
    }

    const content = await renderTemplate(`${DIALOG_PATH}/shop-buy.hbs`, {
      itemName: item.name,
      price: item.price,
      description: item.description,
      characters: characters.map(c => ({ id: c.id, name: c.name, cash: c.system.currency.cash })),
    });

    const result = await safePrompt({
      title: `Buy ${item.name}`,
      content,
      callback: html => html.find('[name="character"]').val(),
    });
    if (!result) return;

    const buyer = game.actors.get(result);
    if (!buyer) return;

    const cash = buyer.system.currency.cash;
    if (cash < item.price) {
      ui.notifications.warn(`${buyer.name} can't afford ${item.name}. Need $${item.price}, have $${cash}.`);
      return;
    }

    const updateData = { "system.currency.cash": cash - item.price };
    if (itemType === "weapon") {
      const weapons = foundry.utils.deepClone(buyer.system.weapons);
      weapons.push({ name: item.name, type: item.type, attribute: item.attribute, skill: item.skill, price: item.price });
      updateData["system.weapons"] = weapons;
    } else {
      const gear = foundry.utils.deepClone(buyer.system.gear);
      gear.push({ name: item.name, description: item.description, price: item.price });
      updateData["system.gear"] = gear;
    }
    await buyer.update(updateData);

    if (item.stock > 0) {
      const arrKey = itemType === "weapon" ? "weapons" : "gear";
      const arr = foundry.utils.deepClone(this.actor.system[arrKey]);
      arr[shopIndex].stock -= 1;
      if (arr[shopIndex].stock === 0) arr.splice(shopIndex, 1);
      await this.actor.update({ [`system.${arrKey}`]: arr });
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: buyer }),
      content: `<div class="vtm-roll"><div class="vtm-roll-label">${buyer.name} purchased ${item.name}</div><div class="vtm-roll-info">from ${this.actor.name} for $${item.price}</div></div>`,
    });
    ui.notifications.info(`${buyer.name} purchased ${item.name} for $${item.price}.`);
  }

  // ==================== ST MANAGEMENT ====================

  async _onAddWeapon(event) {
    event.preventDefault();
    const content = await renderTemplate(`${DIALOG_PATH}/shop-add-weapon.hbs`);
    const result = await safePrompt({
      title: "Add Weapon to Shop",
      content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return {
          name, type: html.find('[name="type"]').val(),
          attribute: html.find('[name="attribute"]').val() || "dexterity",
          skill: html.find('[name="skill"]').val() || "melee",
          price: parseInt(html.find('[name="price"]').val()) || 0,
          description: html.find('[name="desc"]').val() || "",
          stock: parseInt(html.find('[name="stock"]').val()) ?? -1,
        };
      },
    });
    if (!result) return;
    const weapons = foundry.utils.deepClone(this.actor.system.weapons);
    weapons.push(result);
    await this.actor.update({ "system.weapons": weapons });
  }

  async _onAddGear(event) {
    event.preventDefault();
    const content = await renderTemplate(`${DIALOG_PATH}/shop-add-gear.hbs`);
    const result = await safePrompt({
      title: "Add Gear to Shop",
      content,
      callback: html => {
        const name = html.find('[name="name"]').val()?.trim();
        if (!name) return null;
        return {
          name, description: html.find('[name="desc"]').val() || "",
          price: parseInt(html.find('[name="price"]').val()) || 0,
          stock: parseInt(html.find('[name="stock"]').val()) ?? -1,
        };
      },
    });
    if (!result) return;
    const gear = foundry.utils.deepClone(this.actor.system.gear);
    gear.push(result);
    await this.actor.update({ "system.gear": gear });
  }

  async _onImportCatalog(event) {
    event.preventDefault();
    const confirm = await safeConfirm({
      title: "Import Default Catalog",
      content: "<p>Import all items from the default catalog? This will add items that aren't already in the shop.</p>",
    });
    if (!confirm) return;

    const weapons = foundry.utils.deepClone(this.actor.system.weapons);
    const gear = foundry.utils.deepClone(this.actor.system.gear);
    const ownedWeaponNames = weapons.map(w => w.name);
    const ownedGearNames = gear.map(g => g.name);

    for (const w of SHOP_CATALOG.weapons) {
      if (!ownedWeaponNames.includes(w.name)) weapons.push({ ...w, stock: -1 });
    }
    for (const g of SHOP_CATALOG.gear) {
      if (!ownedGearNames.includes(g.name)) gear.push({ ...g, stock: -1 });
    }

    await this.actor.update({ "system.weapons": weapons, "system.gear": gear });
    ui.notifications.info("Default catalog imported.");
  }
}

applySharedHandlers(VTMShopSheet);
