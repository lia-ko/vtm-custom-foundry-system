const { SchemaField, NumberField, StringField, ArrayField, HTMLField } = foundry.data.fields;

export default class CoterieData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // --- Identity ---
      concept: new StringField({ initial: "" }),
      coterieType: new StringField({ initial: "" }),

      // --- Domain ---
      domain: new SchemaField({
        name: new StringField({ initial: "" }),
        description: new StringField({ initial: "" }),
        chasse: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
        lien: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
        portillon: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
      }),

      // --- Haven ---
      haven: new SchemaField({
        name: new StringField({ initial: "" }),
        description: new StringField({ initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
      }),

      // --- Members (actor IDs) ---
      members: new ArrayField(new StringField()),

      // --- Coterie Merits & Flaws ---
      merits: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ initial: "" }),
      })),
      flaws: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ initial: "" }),
      })),

      // --- Relationships ---
      relationships: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ initial: "ally" }), // ally, enemy, contact
        value: new NumberField({ integer: true, initial: 0, min: 0, max: 5 }),
        description: new StringField({ initial: "" }),
      })),

      // --- Notes ---
      notes: new HTMLField({ initial: "" }),
    };
  }
}
