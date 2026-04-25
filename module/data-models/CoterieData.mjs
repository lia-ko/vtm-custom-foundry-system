const { SchemaField, NumberField, StringField, ArrayField, HTMLField } = foundry.data.fields;

export default class CoterieData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      concept: new StringField({ required: true, initial: "" }),
      coterieType: new StringField({ required: true, initial: "" }),

      domain: new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
        chasse: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
        lien: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
        portillon: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
      }),

      haven: new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
      }),

      members: new ArrayField(new StringField({ required: true, initial: "" })),

      merits: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ required: true, initial: "" }),
      })),
      flaws: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ required: true, initial: "" }),
      })),

      relationships: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ required: true, initial: "ally" }),
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
        description: new StringField({ required: true, initial: "" }),
      })),

      notes: new HTMLField({ required: true, initial: "" }),
    };
  }
}
