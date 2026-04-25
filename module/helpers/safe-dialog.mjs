/**
 * Safe wrapper around Dialog.prompt that returns null instead of throwing
 * when the user closes the dialog via Escape or the X button.
 *
 * Usage: const result = await safePrompt({ title, content, callback });
 * Returns null if cancelled.
 */
export async function safePrompt(options) {
  try {
    return await Dialog.prompt(options);
  } catch {
    return null;
  }
}

/**
 * Safe wrapper around Dialog.confirm that returns false instead of throwing.
 */
export async function safeConfirm(options) {
  try {
    return await Dialog.confirm(options);
  } catch {
    return false;
  }
}
