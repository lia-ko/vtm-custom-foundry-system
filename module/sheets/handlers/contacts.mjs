import { safePrompt } from "../../helpers/safe-dialog.mjs";
/** Contact and relationship handlers. */

const DIALOG_PATH = "systems/vtm-custom/templates/dialogs";

export function registerListeners(html, sheet) {
  html.on("click", ".add-contact", sheet._onAddContact.bind(sheet));
  html.on("click", ".delete-contact", sheet._onDeleteItem.bind(sheet, "contacts"));
}

export async function _onAddContact(event) {
  event.preventDefault();
  const content = await renderTemplate(`${DIALOG_PATH}/add-contact.hbs`);
  const result = await safePrompt({
    title: "Add Contact",
    content,
    callback: html => {
      const name = html.find('[name="name"]').val()?.trim();
      if (!name) return null;
      return {
        name,
        type: html.find('[name="type"]').val(),
        value: parseInt(html.find('[name="rating"]').val()) || 0,
        description: html.find('[name="desc"]').val() || "",
      };
    },
  });
  if (!result) return;

  const contacts = foundry.utils.deepClone(this.actor.system.contacts);
  contacts.push(result);
  await this.actor.update({ "system.contacts": contacts });
}
