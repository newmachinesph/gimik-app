import * as Ably from 'ably';

import { useApp } from '@/store';
import { request } from './client';
import { hydrateFromApi, loadThread } from './sync';

/**
 * Listening, as opposed to asking.
 *
 * The server already writes every message to Postgres and publishes it; this
 * is the half that hears it, so a thread updates while it is open instead of
 * on the next hydration.
 *
 * The client never sees the Ably key. It authenticates with a token minted by
 * `POST /realtime/token`, scoped to this person's own channels, and the SDK
 * re-fetches one whenever it expires - which is the whole reason `authCallback`
 * exists rather than a token pasted in at connect time.
 *
 * Realtime is a courtesy on top of the database, never the record. Every event
 * is treated as "something changed, go and look" rather than as data to trust:
 * a dropped or duplicated event costs a refetch, never a wrong screen.
 */

type TokenRequest = Ably.TokenRequest;

let client: Ably.Realtime | null = null;
let userChannel: Ably.RealtimeChannel | null = null;

async function fetchTokenRequest(): Promise<TokenRequest> {
  return request<TokenRequest>('/realtime/token', { method: 'POST' });
}

/** Reconcile one event. Cheap when the thread is known, a full refetch when not. */
async function onServerEvent(threadId: string | undefined): Promise<void> {
  try {
    if (threadId && useApp.getState().threads.some((thread) => thread.id === threadId)) {
      await loadThread(threadId);
      return;
    }
    // A thread this device has never seen - an accepted invite, a new plan -
    // means the shape of the world changed, not just its contents.
    await hydrateFromApi();
  } catch {
    // Offline or refused: the next foreground hydration will catch up.
  }
}

/**
 * Open the connection for the signed-in person. Safe to call repeatedly; a
 * second call while connected is a no-op.
 */
export async function connectRealtime(): Promise<void> {
  if (client) return;
  const state = useApp.getState();
  if (state.source !== 'api') return;

  client = new Ably.Realtime({
    authCallback: (_params, callback) => {
      fetchTokenRequest()
        .then((token) => callback(null, token))
        .catch((error) => callback(error as Ably.ErrorInfo, null));
    },
    // The phone sleeps and wakes constantly; let the SDK ride that out rather
    // than tearing the session down on every backgrounding.
    disconnectedRetryTimeout: 5_000,
    suspendedRetryTimeout: 15_000,
    closeOnUnload: false,
    // Errors only. At the default verbosity the SDK narrates every connection
    // state change through console.warn - including "No activity seen from
    // realtime in 25123ms; assuming connection has dropped" every time the
    // phone idles, which is the expected consequence of a phone being a phone
    // and something the SDK recovers from by itself. In a debug build each of
    // those raises a LogBox card over the tab bar, so the app looks broken
    // while nothing is. Real errors still come through at level 1.
    logLevel: 1,
  });

  const clientId = client.auth.clientId;
  if (!clientId) {
    // The token carries the id; until it arrives there is no channel to name.
    await client.connection.once('connected');
  }
  const id = client.auth.clientId;
  if (!id) return;

  userChannel = client.channels.get(`user:${id}`);
  await userChannel.subscribe((event) => {
    const data = event.data as { threadId?: string } | undefined;
    void onServerEvent(event.name === 'message' ? data?.threadId : undefined);
  });
}

export function disconnectRealtime(): void {
  userChannel?.unsubscribe();
  userChannel = null;
  client?.close();
  client = null;
}

/** For a screen that wants to know whether live updates are actually flowing. */
export const realtimeState = (): string => client?.connection.state ?? 'closed';
