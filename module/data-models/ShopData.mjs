const { SchemaField, NumberField, StringField, ArrayField, HTMLField } = foundry.data.fields;

export default class ShopData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      description: new StringField({ required: true, initial: "" }),
      shopType: new StringField({ required: true, initial: "" }),

      weapons: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ required: true, initial: "Melee" }),
        attribute: new StringField({ required: true, initial: "dexterity" }),
        skill: new StringField({ required: true, initial: "melee" }),
        price: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        description: new StringField({ required: true, initial: "" }),
        stock: new NumberField({ required: true, integer: true, initial: -1, min: -1 }),
      })),

      gear: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
        price: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        stock: new NumberField({ required: true, integer: true, initial: -1, min: -1 }),
      })),

      notes: new HTMLField({ required: true, initial: "" }),
    };
  }
}
