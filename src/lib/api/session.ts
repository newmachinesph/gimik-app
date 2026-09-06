import { resetPlaceCache } from '@/lib/places';
import { resetRegistry } from '@/lib/registry';
import { useApp } from '@/store';
import { auth, ops } from './endpoints';
import { hasApi, loadTokens, setTokens } from './client';
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

export async function signIn(email: string, password: string): Promise<void> {
  await auth.login({ email: email.trim().toLowerCase(), password });
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
  await hydrateFromApi();
}

export async function signOut(): Promise<void> {
  disconnectRealtime();
  void unregisterForPush();
  await auth.signOut();
  resetDirectory();
  resetRegistry();
  resetPlaceCache();
  useApp.getState().reset();
}

/**
 * On a cold start, turn a stored token back into a filled store.
 *
 * Returns false when there is nothing to restore or the token is spent, which
 * the boot gate reads as "show the door". A refresh failure has already
 * cleared the tokens by the time this returns.
 */
export async function restoreSession(): Promise<boolean> {
  if (!hasApi) return false;
  const tokens = await loadTokens();
  if (!tokens) return false;
  try {
    await hydrateFromApi();
    return true;
  } catch {
    await setTokens(null);
    return false;
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
