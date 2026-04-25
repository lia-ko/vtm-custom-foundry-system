const { SchemaField, NumberField, StringField, ArrayField, HTMLField } = foundry.data.fields;

export default class ShopData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // --- Shop Info ---
      description: new StringField({ initial: "" }),
      shopType: new StringField({ initial: "" }), // e.g. "Black Market", "Gun Dealer", "Occult Shop"

      // --- Weapons for sale ---
      weapons: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ initial: "Melee" }),
        attribute: new StringField({ initial: "dexterity" }),
        skill: new StringField({ initial: "melee" }),
        price: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        description: new StringField({ initial: "" }),
        stock: new NumberField({ integer: true, initial: -1, min: -1 }), // -1 = unlimited
      })),

      // --- Gear for sale ---
      gear: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ initial: "" }),
        price: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        stock: new NumberField({ integer: true, initial: -1, min: -1 }), // -1 = unlimited
      })),

      // --- Notes (ST-only) ---
      notes: new HTMLField({ initial: "" }),
    };
  }
}
