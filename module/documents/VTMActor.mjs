export default class VTMActor extends Actor {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** Set default token bar configuration for new actors. */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (this.type === "vampire") {
      const prototypeToken = {
        bar1: { attribute: "healthBar" },
        bar2: { attribute: "hungerBar" },
        displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      };

      this.updateSource({ prototypeToken });
    }
  }
}
