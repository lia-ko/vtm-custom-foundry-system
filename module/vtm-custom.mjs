import VampireCharacterData from "./data-models/VampireCharacterData.mjs";
import VTMActor from "./documents/VTMActor.mjs";
import VTMVampireSheet from "./sheets/VTMVampireSheet.mjs";

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

  // Register data models
  CONFIG.Actor.dataModels.vampire = VampireCharacterData;

  // Register custom document classes
  CONFIG.Actor.documentClass = VTMActor;

  // Register sheets
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("vtm-custom", VTMVampireSheet, {
    types: ["vampire"],
    makeDefault: true,
    label: "VTM.SheetVampire",
  });

  // Preload Handlebars templates
  loadTemplates([
    "systems/vtm-custom/templates/actor/vampire-sheet.hbs",
  ]);
});

Hooks.once("ready", () => {
  console.log("vtm-custom | System ready");
});
