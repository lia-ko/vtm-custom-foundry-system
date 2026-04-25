import { getBloodPotencyEffects } from "../data/blood-potency.mjs";

const { SchemaField, NumberField, StringField, ArrayField, BooleanField, HTMLField } = foundry.data.fields;

function attributeField(initial = 1) {
  return new NumberField({ required: true, nullable: false, integer: true, initial, min: 0, max: 10 });
}

function skillField(initial = 0) {
  return new NumberField({ required: true, nullable: false, integer: true, initial, min: 0, max: 5 });
}

export default class VampireCharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // --- Bio / Identity ---
      clan: new StringField({ required: true, initial: "" }),
      generation: new StringField({ required: true, initial: "13th" }),
      sire: new StringField({ required: true, initial: "" }),
      nature: new StringField({ required: true, initial: "" }),
      demeanor: new StringField({ required: true, initial: "" }),
      concept: new StringField({ required: true, initial: "" }),
      chronicle: new StringField({ required: true, initial: "" }),
      apparentAge: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      trueAge: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      haven: new StringField({ required: true, initial: "" }),

      // --- Attributes (3x3 grid) ---
      attributes: new SchemaField({
        strength: attributeField(),
        dexterity: attributeField(),
        stamina: attributeField(),
        charisma: attributeField(),
        manipulation: attributeField(),
        appearance: attributeField(),
        perception: attributeField(),
        intelligence: attributeField(),
        wits: attributeField(),
      }),

      // --- Abilities (Talents / Skills / Knowledges) ---
      talents: new SchemaField({
        alertness: skillField(),
        athletics: skillField(),
        awareness: skillField(),
        brawl: skillField(),
        empathy: skillField(),
        expression: skillField(),
        intimidation: skillField(),
        leadership: skillField(),
        streetwise: skillField(),
        subterfuge: skillField(),
      }),

      skills: new SchemaField({
        animalKen: skillField(),
        crafts: skillField(),
        drive: skillField(),
        etiquette: skillField(),
        firearms: skillField(),
        larceny: skillField(),
        melee: skillField(),
        performance: skillField(),
        stealth: skillField(),
        survival: skillField(),
      }),

      knowledges: new SchemaField({
        academics: skillField(),
        computer: skillField(),
        finance: skillField(),
        investigation: skillField(),
        law: skillField(),
        medicine: skillField(),
        occult: skillField(),
        politics: skillField(),
        science: skillField(),
        technology: skillField(),
      }),

      // --- Disciplines (dynamic list) ---
      disciplines: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        path: new StringField({ required: true, initial: "" }),
        icon: new StringField({ required: true, initial: "\u2666" }),
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 10 }),
        color: new StringField({ required: true, initial: "" }),
        open: new BooleanField({ required: true, initial: true }),
        powers: new ArrayField(new SchemaField({
          name: new StringField({ required: true, initial: "" }),
          level: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
          description: new StringField({ required: true, initial: "" }),
          cost: new StringField({ required: true, initial: "Free" }),
          pool: new StringField({ required: true, initial: "--" }),
          type: new StringField({ required: true, initial: "ut" }),
          amalgam: new StringField({ required: true, initial: "" }),
          pin: new BooleanField({ required: true, initial: false }),
        })),
      })),

      // --- Rituals (dynamic list) ---
      rituals: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        level: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ required: true, initial: "" }),
        cost: new StringField({ required: true, initial: "1 Rouse" }),
        pool: new StringField({ required: true, initial: "Int + Blood Sorcery" }),
        ingredients: new StringField({ required: true, initial: "" }),
        time: new StringField({ required: true, initial: "" }),
        custom: new BooleanField({ required: true, initial: false }),
      })),

      // --- Thin-Blood Alchemy Formulas (dynamic list) ---
      formulas: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        level: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ required: true, initial: "" }),
        cost: new StringField({ required: true, initial: "1 Rouse" }),
        pool: new StringField({ required: true, initial: "Int + Alchemy" }),
        ingredients: new StringField({ required: true, initial: "" }),
        time: new StringField({ required: true, initial: "" }),
        custom: new BooleanField({ required: true, initial: false }),
      })),

      // --- Willpower ---
      willpower: new SchemaField({
        max: new NumberField({ required: true, integer: true, initial: 1, min: 0, max: 10 }),
        current: new NumberField({ required: true, integer: true, initial: 1, min: 0, max: 10 }),
      }),

      // --- Health (V5: array of damage states per box) ---
      health: new ArrayField(
        new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 2 }),
        { initial: [0, 0, 0, 0, 0, 0, 0] }
      ),

      // --- Blood Potency ---
      bloodPotency: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 10 }),

      // --- Hunger (V5) ---
      hunger: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),

      // --- Humanity & Stains ---
      humanity: new NumberField({ required: true, integer: true, initial: 7, min: 0, max: 10 }),
      stains: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 10 }),
      touchstones: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
        conviction: new StringField({ required: true, initial: "" }),
      })),

      // --- Frenzy state ---
      frenzy: new StringField({ required: true, initial: "" }),

      // --- Feeding / Resonance ---
      resonance: new StringField({ required: true, initial: "" }),
      lastFeedDate: new StringField({ required: true, initial: "" }),

      // --- Contacts / Relationships ---
      contacts: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ required: true, initial: "contact" }),
        description: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),
      })),

      // --- Experience ---
      experience: new SchemaField({
        total: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        spent: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      }),

      // --- XP Log ---
      xpLog: new ArrayField(new SchemaField({
        type: new StringField({ required: true, initial: "add" }),
        amount: new NumberField({ required: true, integer: true, initial: 0 }),
        reason: new StringField({ required: true, initial: "" }),
      })),

      // --- Backgrounds (dynamic list) ---
      backgrounds: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ required: true, initial: "" }),
      })),

      // --- Merits & Flaws (dynamic list) ---
      merits: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        category: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
      })),
      flaws: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        category: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
      })),

      // --- Weapons ---
      weapons: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ required: true, initial: "Melee" }),
        attribute: new StringField({ required: true, initial: "dexterity" }),
        skill: new StringField({ required: true, initial: "melee" }),
        price: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      })),

      // --- Gear ---
      gear: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: true, initial: "" }),
        price: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      })),

      // --- Currency ---
      currency: new SchemaField({
        cash: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      }),

      // --- Notes ---
      biography: new HTMLField({ required: true, initial: "" }),
      notes: new HTMLField({ required: true, initial: "" }),
    };
  }

  // --- Derived Data ---
  prepareDerivedData() {
    this.healthDamaged = (this.health ?? []).filter(v => v > 0).length;
    this.healthTotal = (this.health ?? []).length;
    this.bpEffects = getBloodPotencyEffects(this.bloodPotency);
    this.healthBar = { value: this.healthTotal - this.healthDamaged, max: this.healthTotal };
    this.hungerBar = { value: this.hunger, max: 5 };
    this.experience.remaining = this.experience.total - this.experience.spent;
  }
}
