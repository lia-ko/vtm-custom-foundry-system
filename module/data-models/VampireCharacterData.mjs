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
      clan: new StringField({ initial: "" }),
      generation: new StringField({ initial: "13th" }),
      sire: new StringField({ initial: "" }),
      nature: new StringField({ initial: "" }),
      demeanor: new StringField({ initial: "" }),
      concept: new StringField({ initial: "" }),
      chronicle: new StringField({ initial: "" }),
      apparentAge: new NumberField({ integer: true, initial: 0, min: 0 }),
      trueAge: new NumberField({ integer: true, initial: 0, min: 0 }),
      haven: new StringField({ initial: "" }),

      // --- Attributes (3x3 grid) ---
      attributes: new SchemaField({
        // Physical
        strength: attributeField(),
        dexterity: attributeField(),
        stamina: attributeField(),
        // Social
        charisma: attributeField(),
        manipulation: attributeField(),
        appearance: attributeField(),
        // Mental
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
        path: new StringField({ initial: "" }),
        icon: new StringField({ initial: "\u2666" }),
        value: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 10 }),
        color: new StringField({ initial: "" }),
        open: new BooleanField({ initial: true }),
        powers: new ArrayField(new SchemaField({
          name: new StringField({ required: true, initial: "" }),
          level: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
          description: new StringField({ initial: "" }),
          cost: new StringField({ initial: "Free" }),
          pool: new StringField({ initial: "--" }),
          type: new StringField({ initial: "ut" }), // "cb", "ut", "ri"
          amalgam: new StringField({ initial: "" }),
          pin: new BooleanField({ initial: false }),
        })),
      })),

      // --- Rituals (dynamic list) ---
      rituals: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        level: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ initial: "" }),
        cost: new StringField({ initial: "1 Rouse" }),
        pool: new StringField({ initial: "Int + Blood Sorcery" }),
        ingredients: new StringField({ initial: "" }),
        time: new StringField({ initial: "" }),
        custom: new BooleanField({ initial: false }),
      })),

      // --- Willpower ---
      willpower: new SchemaField({
        max: new NumberField({ required: true, integer: true, initial: 1, min: 0, max: 10 }),
        current: new NumberField({ required: true, integer: true, initial: 1, min: 0, max: 10 }),
      }),

      // --- Health (V5: array of damage states per box) ---
      // Each value: 0 = empty, 1 = superficial, 2 = aggravated
      health: new ArrayField(
        new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 2 }),
        { initial: [0, 0, 0, 0, 0, 0, 0] }
      ),

      // --- Blood Potency ---
      bloodPotency: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 10 }),

      // --- Hunger (V5) ---
      hunger: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 5 }),

      // --- Humanity ---
      humanity: new NumberField({ required: true, integer: true, initial: 7, min: 0, max: 10 }),

      // --- Frenzy state ---
      // "" = not in frenzy, "fury", "hunger", "rotschreck"
      frenzy: new StringField({ initial: "" }),

      // --- Feeding / Resonance ---
      resonance: new StringField({ initial: "" }), // sanguine, choleric, melancholic, phlegmatic, animal, empty
      lastFeedDate: new StringField({ initial: "" }),

      // --- Contacts / Relationships ---
      contacts: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ initial: "contact" }), // ally, enemy, contact, lover, sire, other
        description: new StringField({ initial: "" }),
        value: new NumberField({ integer: true, initial: 0, min: 0, max: 5 }),
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
        reason: new StringField({ initial: "" }),
      })),

      // --- Backgrounds (dynamic list) ---
      backgrounds: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        description: new StringField({ initial: "" }),
      })),

      // --- Merits & Flaws (dynamic list) ---
      merits: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        category: new StringField({ initial: "" }),
        description: new StringField({ initial: "" }),
      })),
      flaws: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 5 }),
        category: new StringField({ initial: "" }),
        description: new StringField({ initial: "" }),
      })),

      // --- Weapons ---
      weapons: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        type: new StringField({ initial: "Melee" }),
        attribute: new StringField({ initial: "dexterity" }),
        skill: new StringField({ initial: "melee" }),
        price: new NumberField({ integer: true, initial: 0, min: 0 }),
      })),

      // --- Gear ---
      gear: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ initial: "" }),
        price: new NumberField({ integer: true, initial: 0, min: 0 }),
      })),

      // --- Currency ---
      currency: new SchemaField({
        cash: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      }),

      // --- Notes ---
      biography: new HTMLField({ initial: "" }),
      notes: new HTMLField({ initial: "" }),
    };
  }

  // --- Derived Data ---
  prepareDerivedData() {
    // Count damaged health boxes
    this.healthDamaged = (this.health ?? []).filter(v => v > 0).length;
    this.healthTotal = (this.health ?? []).length;

    // Blood Potency effects
    this.bpEffects = getBloodPotencyEffects(this.bloodPotency);

    // Token bar-compatible health (undamaged boxes as "current", total as "max")
    this.healthBar = {
      value: this.healthTotal - this.healthDamaged,
      max: this.healthTotal,
    };

    // Token bar-compatible hunger (inverted: 5 - hunger so bar drains as hunger rises)
    this.hungerBar = {
      value: this.hunger,
      max: 5,
    };

    // Remaining XP
    this.experience.remaining = this.experience.total - this.experience.spent;
  }
}
