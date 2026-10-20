import { Alert, Platform } from 'react-native';

/**
 * One place for user-facing messages and confirmations.
 *
 * Mobile (iOS/Android) keeps the native Alert dialogs, exactly as before.
 * Web shows in-app toasts and dialogs drawn by <FeedbackHost /> (mounted in
 * App.js), because the browser's alert()/confirm() freeze the page and look
 * out of place in a web app.
 */
let host = null;

/** Called by <FeedbackHost />; returns an unregister function. */
export function registerFeedbackHost(nextHost) {
  host = nextHost;
  return () => {
    if (host === nextHost) host = null;
  };
}

/**
 * Show a message. type: 'error' | 'success' | 'info' (changes the web toast colour).
 */
export function notify(title, message, type = 'error') {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message);
    return;
  }
  if (host) host.showToast({ title, message, type });
  else console.warn(`${title}: ${message}`);
}

/**
 * Ask the user to confirm an action. Resolves to true when they confirm.
 */
export function confirmAction({ title, message, confirmText = 'OK', cancelText = 'Cancel', destructive = false }) {
  if (Platform.OS !== 'web') {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
          { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  }
  if (!host) return Promise.resolve(false);
  return host.showConfirm({ title, message, confirmText, cancelText, destructive });
}
