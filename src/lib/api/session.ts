import { resetPlaceCache } from '@/lib/places';
import { resetRegistry } from '@/lib/registry';
import { resetBillingSession } from '@/lib/billing';
import { useApp } from '@/store';
import { auth, ops } from './endpoints';
import { ApiError, hasApi, loadTokens, onSessionExpired, setTokens } from './client';
import { forgetGoogle, getGoogleIdToken } from './google';
import { resetDirectory } from './directory';
import { unregisterForPush } from './push';
import { disconnectRealtime } from './realtime';
import { hydrateFromApi } from './sync';

/**
 * Signing in, signing up, signing out - and the one question every caller
 * actually wants answered: is there a server, and does this device have a
 * session on it?
 *
 * Nothing here catches: a failed sign-in is the caller's to show, because only
 * the caller knows where the message goes.
 */

export { hasApi };

function clearLocalSession(): void {
  resetBillingSession();
  disconnectRealtime();
  resetDirectory();
  resetRegistry();
  resetPlaceCache();
  useApp.getState().reset();
}

/** Mounted by the root so expiry is handled from any authenticated screen. */
export function watchSessionExpiry(): () => void {
  return onSessionExpired(clearLocalSession);
}

export async function signIn(email: string, password: string): Promise<void> {
  await auth.login({ email: email.trim().toLowerCase(), password });
  clearLocalSession();
  await hydrateFromApi();
}

/**
 * Sign in with Google. Covers signing up too: the server decides which one it
 * was, since only it knows whether that Google account has been here before.
 *
 * Throws GoogleCancelled when the person simply backed out, which callers are
 * expected to swallow rather than show as a failure.
 */
export async function signInWithGoogle(): Promise<void> {
  const idToken = await getGoogleIdToken();
  await auth.google({ id_token: idToken });
  clearLocalSession();
  await hydrateFromApi();
}

export async function signUp(input: {
  email: string;
  password: string;
  name: string;
  birthday?: string | null;
  gender?: string | null;
}): Promise<void> {
  await auth.register({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    name: input.name.trim(),
    birthday: input.birthday ?? null,
    gender: input.gender ?? null,
  });
  clearLocalSession();
  await hydrateFromApi();
}

export async function signOut(): Promise<void> {
  // Drop Google too, or the next sign-in silently reuses this account.
  await forgetGoogle();
  disconnectRealtime();
  void unregisterForPush();
  await auth.signOut();
  clearLocalSession();
}

/**
 * On a cold start, turn a stored token back into a filled store.
 *
 * Rejected/missing credentials clear the cached account as well as tokens.
 * A temporary outage keeps an existing account available offline.
 */
export async function restoreSession(): Promise<boolean> {
  if (!hasApi) return false;
  const tokens = await loadTokens();
  if (!tokens) {
    if (useApp.getState().source === 'api') clearLocalSession();
    return false;
  }
  try {
    await hydrateFromApi();
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await setTokens(null);
      clearLocalSession();
      return false;
    }
    const state = useApp.getState();
    return state.source === 'api' && state.onboarded;
  }
}

/** Whether the API is reachable at all - used to explain, not to gate. */
export async function apiReachable(): Promise<boolean> {
  if (!hasApi) return false;
  try {
    const health = await ops.health();
    return health.status === 'ok' || health.status === 'degraded';
  } catch {
    return false;
  }
}
