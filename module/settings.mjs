/** Register all world settings (ST-configurable). */

export function registerSettings() {
  game.settings.register("vtm-custom", "huntingDifficulty", {
    name: "Hunting Difficulty",
    hint: "Number of successes needed on a hunting roll. Higher = harder to find prey.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    range: { min: 1, max: 5, step: 1 },
  });

  game.settings.register("vtm-custom", "huntingPool", {
    name: "Default Hunting Pool",
    hint: "Default dice pool description for hunting rolls (e.g. 'Wits + Streetwise'). Players can override in the dialog.",
    scope: "world",
    config: true,
    type: String,
    default: "Wits + Streetwise",
  });

  game.settings.register("vtm-custom", "hungerSlaked", {
    name: "Hunger Slaked per Feeding",
    hint: "How much Hunger is reduced on a successful hunt (before Blood Potency penalties).",
    scope: "world",
    config: true,
    type: Number,
    default: 2,
    range: { min: 1, max: 4, step: 1 },
  });

  game.settings.register("vtm-custom", "resonanceWeights", {
    name: "Resonance Weights",
    hint: "Comma-separated weights for random resonance: sanguine,choleric,melancholic,phlegmatic,empty. Default: equal chance.",
    scope: "world",
    config: true,
    type: String,
    default: "20,20,20,20,20",
  });
}
