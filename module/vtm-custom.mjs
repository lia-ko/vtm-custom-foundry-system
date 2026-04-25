import { registerSettings } from "./settings.mjs";
import VampireCharacterData from "./data-models/VampireCharacterData.mjs";
import CoterieData from "./data-models/CoterieData.mjs";
import VTMActor from "./documents/VTMActor.mjs";
import VTMVampireSheet from "./sheets/VTMVampireSheet.mjs";
import VTMCoterieSheet from "./sheets/VTMCoterieSheet.mjs";
import ShopData from "./data-models/ShopData.mjs";
import VTMShopSheet from "./sheets/VTMShopSheet.mjs";

Hooks.once("init", () => {
  console.log("vtm-custom | Initializing Vampire: The Masquerade (Custom)");

  // Store system config on the global CONFIG object
  CONFIG.VTM = {
    damageTypes: {
      none: "VTM.DamageNone",
      superficial: "VTM.DamageSuperficial",
      aggravated: "VTM.DamageAggravated",
    },
  };

  // Register Handlebars helpers
  Handlebars.registerHelper("math", (index, offset) => index + offset);
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("dotArray", (current, max) => {
    return Array.from({ length: max }, (_, i) => i < current);
  });
  Handlebars.registerHelper("keys", (str) => str.split(","));
  Handlebars.registerHelper("lookup", (obj, key) => obj?.[key] ?? 0);
  Handlebars.registerHelper("lookupDefault", (obj, key, def) => obj?.[key] ?? def);
  Handlebars.registerHelper("formatKey", (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()));

  // Register world settings
  registerSettings();

  // Register data models
  CONFIG.Actor.dataModels.vampire = VampireCharacterData;
  CONFIG.Actor.dataModels.coterie = CoterieData;
  CONFIG.Actor.dataModels.shop = ShopData;

  // Register custom document classes
  CONFIG.Actor.documentClass = VTMActor;

  // Register sheets
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("vtm-custom", VTMVampireSheet, {
    types: ["vampire"],
    makeDefault: true,
    label: "VTM.SheetVampire",
  });
  Actors.registerSheet("vtm-custom", VTMCoterieSheet, {
    types: ["coterie"],
    makeDefault: true,
    label: "VTM.SheetCoterie",
  });
  Actors.registerSheet("vtm-custom", VTMShopSheet, {
    types: ["shop"],
    makeDefault: true,
    label: "VTM.SheetShop",
  });

  // Preload Handlebars templates
  loadTemplates([
    // Vampire sheet
    "systems/vtm-custom/templates/actor/vampire-sheet.hbs",
    "systems/vtm-custom/templates/actor/partials/_resource-bar.hbs",
    "systems/vtm-custom/templates/actor/partials/_dot-row.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-attributes.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-skills.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-disciplines.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-traits.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-contacts.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-inventory.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-xp.hbs",
    "systems/vtm-custom/templates/actor/partials/_tab-bio.hbs",
    // Coterie sheet
    "systems/vtm-custom/templates/actor/coterie-sheet.hbs",
    "systems/vtm-custom/templates/actor/coterie-partials/_tab-domain.hbs",
    "systems/vtm-custom/templates/actor/coterie-partials/_tab-members.hbs",
    "systems/vtm-custom/templates/actor/coterie-partials/_tab-traits.hbs",
    "systems/vtm-custom/templates/actor/coterie-partials/_tab-relationships.hbs",
    "systems/vtm-custom/templates/actor/coterie-partials/_tab-notes.hbs",
    // Shop sheet
    "systems/vtm-custom/templates/actor/shop-sheet.hbs",
    "systems/vtm-custom/templates/actor/shop-partials/_tab-weapons.hbs",
    "systems/vtm-custom/templates/actor/shop-partials/_tab-gear.hbs",
    "systems/vtm-custom/templates/actor/shop-partials/_tab-manage.hbs",
    // Dialog templates
    "systems/vtm-custom/templates/dialogs/roll-dialog.hbs",
    "systems/vtm-custom/templates/dialogs/frenzy-dialog.hbs",
    "systems/vtm-custom/templates/dialogs/add-from-list.hbs",
    "systems/vtm-custom/templates/dialogs/custom-ritual.hbs",
    "systems/vtm-custom/templates/dialogs/custom-merit-flaw.hbs",
    "systems/vtm-custom/templates/dialogs/xp-dialog.hbs",
    "systems/vtm-custom/templates/dialogs/shop-buy.hbs",
    "systems/vtm-custom/templates/dialogs/shop-add-weapon.hbs",
    "systems/vtm-custom/templates/dialogs/shop-add-gear.hbs",
    "systems/vtm-custom/templates/dialogs/coterie-add-trait.hbs",
    "systems/vtm-custom/templates/dialogs/coterie-add-relationship.hbs",
    "systems/vtm-custom/templates/dialogs/hunt-dialog.hbs",
    "systems/vtm-custom/templates/dialogs/add-contact.hbs",
    // Chat messages
    "systems/vtm-custom/templates/chat/v5-roll.hbs",
    "systems/vtm-custom/templates/chat/rouse-check.hbs",
    // Wizard
    "systems/vtm-custom/templates/apps/wizard.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-identity.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-attributes.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-skills.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-disciplines.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-predator.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-advantages.hbs",
    "systems/vtm-custom/templates/apps/wizard-steps/_step-final.hbs",
  ]);
});

Hooks.once("ready", () => {
  console.log("vtm-custom | System ready");
});

// Open character creation wizard for new vampire actors
Hooks.on("createActor", async (actor) => {
  if (actor.type === "vampire" && actor.isOwner) {
    // Only open wizard if the character is fresh (no clan set)
    if (!actor.system.clan) {
      const { default: CharacterCreationWizard } = await import("./apps/CharacterCreationWizard.mjs");
      new CharacterCreationWizard(actor).render(true);
    }
  }
});
