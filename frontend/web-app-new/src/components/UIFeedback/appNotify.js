/**
 * Imperative UI feedback (toasts + modal alert/confirm).
 * Registered by UIFeedbackProvider in App.js.
 */

let impl = null;

export function setAppNotifyImplementation(api) {
  impl = api;
}

/** Short auto-dismiss message (success, error, info, warning). */
export function appToast(message, variant = "info") {
  if (!message) return;
  impl?.toast?.(String(message), variant);
}

/** Modal with a single OK button. Returns a Promise resolved when dismissed. */
export function appAlert(message, options = {}) {
  if (!impl?.alert) {
    window.alert(String(message));
    return Promise.resolve();
  }
  return impl.alert(String(message), options);
}

/** Modal with Cancel + OK. Returns Promise<boolean>. */
export function appConfirm(message, options = {}) {
  if (!impl?.confirm) {
    return Promise.resolve(window.confirm(String(message)));
  }
  return impl.confirm(String(message), options);
}
