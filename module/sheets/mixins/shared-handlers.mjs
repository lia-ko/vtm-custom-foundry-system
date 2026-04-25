/** Shared handler methods used by multiple sheet types. */

/**
 * Generic expand/collapse toggle.
 * Elements need class "expandable-toggle" with data-expand-group and data-expand-id.
 * Detail panels need class "expandable-detail" with matching data attributes.
 */
export function _onToggleDetail(event) {
  event.preventDefault();
  event.stopPropagation();
  const el = event.currentTarget;
  const group = el.dataset.expandGroup;
  const id = el.dataset.expandId;
  const detail = this.element.find(`.expandable-detail[data-expand-group="${group}"][data-expand-id="${id}"]`);
  const isVisible = detail.is(":visible");

  this.element.find(`.expandable-detail[data-expand-group="${group}"]`).hide();
  this.element.find(`.expandable-toggle[data-expand-group="${group}"]`).each(function () {
    this.innerHTML = this.innerHTML.replace("\u25BE", "\u25BA");
  });

  if (!isVisible) {
    detail.show();
    el.innerHTML = el.innerHTML.replace("\u25BA", "\u25BE");
  }
}

/**
 * Generic delete from a system array by index.
 * Bind with: sheet._onDeleteFromArray.bind(sheet, "arrayKey")
 */
export async function _onDeleteFromArray(arrayKey, event) {
  event.preventDefault();
  const index = parseInt(event.currentTarget.dataset.index);
  const arr = foundry.utils.deepClone(this.actor.system[arrayKey]);
  arr.splice(index, 1);
  await this.actor.update({ [`system.${arrayKey}`]: arr });
}

/**
 * Apply shared handlers to a sheet class prototype.
 * @param {Function} SheetClass - The sheet class to enhance
 */
export function applySharedHandlers(SheetClass) {
  SheetClass.prototype._onToggleDetail = _onToggleDetail;
  SheetClass.prototype._onDeleteFromArray = _onDeleteFromArray;
  // Alias for backward compat with vampire sheet
  SheetClass.prototype._onDeleteItem = _onDeleteFromArray;
}

/**
 * Register shared listeners on an html element.
 * @param {jQuery} html
 * @param {ActorSheet} sheet
 */
export function registerSharedListeners(html, sheet) {
  html.on("click", ".expandable-toggle", sheet._onToggleDetail.bind(sheet));
}
