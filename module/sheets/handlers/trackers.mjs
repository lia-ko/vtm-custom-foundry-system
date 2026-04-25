/** Resource tracker handlers: health, willpower, hunger, humanity, blood potency, dots. */

export function registerListeners(html, sheet) {
  html.on("click", ".dmg-box", sheet._onHealthCycle.bind(sheet));
  html.on("click", "[data-tracker]:not(.dmg-box)", sheet._onTrackerClick.bind(sheet));
  html.on("click", ".dot-set .dot", sheet._onDotClick.bind(sheet));
  html.on("click", "[data-adv-type] .dot", sheet._onAdvDotClick.bind(sheet));
}

export async function _onHealthCycle(event) {
  event.preventDefault();
  const index = parseInt(event.currentTarget.dataset.index);
  const health = foundry.utils.deepClone(this.actor.system.health);
  health[index] = (health[index] + 1) % 3;
  await this.actor.update({ "system.health": health });
}

export async function _onTrackerClick(event) {
  event.preventDefault();
  const tracker = event.currentTarget.dataset.tracker;
  const clickedValue = parseInt(event.currentTarget.dataset.index) + 1;
  const pathMap = { willpower: "system.willpower.current", hunger: "system.hunger", humanity: "system.humanity", bloodPotency: "system.bloodPotency" };
  const currentMap = { willpower: this.actor.system.willpower.current, hunger: this.actor.system.hunger, humanity: this.actor.system.humanity, bloodPotency: this.actor.system.bloodPotency };
  const path = pathMap[tracker];
  if (!path) return;
  const current = currentMap[tracker];
  await this.actor.update({ [path]: current === clickedValue ? clickedValue - 1 : clickedValue });
}

export async function _onDotClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const { group, key, value } = event.currentTarget.dataset;
  const clickedValue = parseInt(value);
  const path = `system.${group}.${key}`;
  const current = foundry.utils.getProperty(this.actor, path);
  await this.actor.update({ [path]: current === clickedValue ? clickedValue - 1 : clickedValue });
}

export async function _onAdvDotClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const { advType, advIndex, value } = event.currentTarget.dataset;
  const clickedValue = parseInt(value);
  const arr = foundry.utils.deepClone(this.actor.system[advType]);
  const current = arr[parseInt(advIndex)].value;
  arr[parseInt(advIndex)].value = current === clickedValue ? clickedValue - 1 : clickedValue;
  await this.actor.update({ [`system.${advType}`]: arr });
}
