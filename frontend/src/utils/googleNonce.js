import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

/**
 * Nonce for Google sign-in on web.
 *
 * On web, Google puts a nonce inside the ID token and Supabase rejects the
 * token unless the backend is given the matching original value. So the app
 * creates the nonce itself: Google receives its SHA-256 hash (extraParams),
 * and the backend receives the raw value (sent with the ID token).
 *
 * Mobile: not applied — returns empty values so the native flow is unchanged.
 * To use it on mobile too, remove the Platform check below and test Google
 * sign-in on an Expo development build (Expo Go cannot test this flow).
 *
 * Returns { raw, extraParams }; extraParams is memoised because the Google
 * hook rebuilds its request whenever that object changes.
 */
export function useGoogleWebNonce() {
  const [nonce, setNonce] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    let active = true;
    (async () => {
      const raw = Crypto.randomUUID();
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
      if (active) setNonce({ raw, hashed });
    })();
    return () => { active = false; };
  }, []);

  const extraParams = useMemo(() => (nonce ? { nonce: nonce.hashed } : undefined), [nonce]);
  return { raw: nonce ? nonce.raw : null, extraParams };
}
