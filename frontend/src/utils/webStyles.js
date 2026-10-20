import { Platform } from 'react-native';

/**
 * Browser-only CSS that React Native styles cannot express.
 * Mobile has no CSS, so this does nothing there; focus styling on mobile is
 * handled by the OS (keyboard focus and screen readers).
 */
const WEB_CSS = `
/* Replace the browser's default white focus box around text fields with the
   app's green ring, drawn on the field's rounded container. */
input, textarea { outline: none; }
div:has(> input:focus-visible), div:has(> textarea:focus-visible) {
  box-shadow: 0 0 0 2px #0df269;
}
/* Keyboard users still see which button is focused. */
[role="button"]:focus-visible, [tabindex="0"]:focus-visible {
  outline: 2px solid #0df269;
  outline-offset: 2px;
}
`;

export function installWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('squadspot-web-styles')) return;
  const style = document.createElement('style');
  style.id = 'squadspot-web-styles';
  style.textContent = WEB_CSS;
  document.head.appendChild(style);
}
