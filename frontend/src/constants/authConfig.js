/**
 * SquadSpot Authentication & OAuth Configuration
 *
 * Developer / Project Owner Email: dhairyasoni997@gmail.com
 * Supabase Project URL: https://sgdbjkywdpqwhhsljyke.supabase.co
 */

export const GOOGLE_AUTH_CONFIG = {
  // Developer contact & test account
  developerEmail: 'dhairyasoni997@gmail.com',

  // Google OAuth 2.0 Client IDs
  webClientId: '526362857163-4k6hmjm5d9r3prbri98pql1f5cfld4kn.apps.googleusercontent.com',
  androidClientId: '526362857163-4k6hmjm5d9r3prbri98pql1f5cfld4kn.apps.googleusercontent.com',
  iosClientId: '526362857163-4k6hmjm5d9r3prbri98pql1f5cfld4kn.apps.googleusercontent.com',

  // Redirect URIs configured for OAuth
  redirectUris: {
    supabaseCallback: 'https://sgdbjkywdpqwhhsljyke.supabase.co/auth/v1/callback',
    expoAuthProxy: 'https://auth.expo.io/@ansh-mistrys-organization/squadspot',
  },
};
