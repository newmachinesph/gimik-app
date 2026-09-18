import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TokenPair } from './schema';

/**
 * The transport, and the only place that knows the API exists.
 *
 * It does four things and no more: attach the access token, retry once through
 * refresh when the server says the token is stale, turn a non-2xx into a typed
 * error instead of a silent `undefined`, and give every request a deadline. No
 * caching, no state, no domain vocabulary - the screens keep talking to the
 * store, and the seam that binds store to server sits above this.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
const TOKEN_KEY = 'gimik-v2-tokens';
const TIMEOUT_MS = 15_000;

/** Whether an API is configured at all. False means the app is on demo data. */
export const hasApi = Boolean(BASE_URL);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** The server's `detail`, when it sent one worth showing. */
    readonly detail: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Nothing the user can do about a 5xx; everything about a 4xx. */
  get isClientFault() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * The server refused because this account is not on Plus.
   *
   * 402 rather than 403 throughout the API, precisely so this can be told
   * apart from "not yours" without parsing a message. A screen that sees it
   * should offer the upgrade, never an error.
   */
  get needsPlus() {
    return this.status === 402;
  }
}

/** Thrown when the request never got an answer: offline, DNS, or the deadline. */
export class NetworkError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

let tokens: TokenPair | null = null;
let sessionGeneration = 0;
let refreshing: { generation: number; promise: Promise<TokenPair | null> } | null = null;
const expiryListeners = new Set<() => void>();

/** Session owners clear their cached state when credentials are rejected. */
export function onSessionExpired(listener: () => void): () => void {
  expiryListeners.add(listener);
  return () => { expiryListeners.delete(listener); };
}

export async function loadTokens(): Promise<TokenPair | null> {
  if (tokens) return tokens;
  const generation = sessionGeneration;
  const raw = await AsyncStorage.getItem(TOKEN_KEY);
  if (generation === sessionGeneration) tokens = raw ? (JSON.parse(raw) as TokenPair) : null;
  return tokens;
}

export async function setTokens(next: TokenPair | null): Promise<void> {
  sessionGeneration += 1;
  await persistTokens(next);
}

async function persistTokens(next: TokenPair | null): Promise<void> {
  tokens = next;
  if (next) await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(next));
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

async function expireSession(generation: number): Promise<void> {
  if (generation !== sessionGeneration || !tokens) return;
  const clearing = setTokens(null);
  // Notify synchronously: the protected-route guard must close even while
  // AsyncStorage is still removing the credentials.
  for (const listener of expiryListeners) listener();
  await clearing;
}

export const isSignedIn = () => Boolean(tokens);

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skip the Authorization header - only /auth/login, /register and /refresh. */
  anonymous?: boolean;
  signal?: AbortSignal;
};

async function send(path: string, options: RequestOptions, accessToken: string | null): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // An external abort must still cancel the request, so both are honoured.
  options.signal?.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (cause) {
    throw new NetworkError(controller.signal.aborted ? 'The request timed out.' : 'Could not reach Gimik.', cause);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One refresh at a time. Six screens waking at once must not fire six refreshes
 * and race each other into signing the person out.
 */
async function refreshTokens(generation: number): Promise<TokenPair | null> {
  if (generation !== sessionGeneration) return null;
  if (refreshing?.generation === generation) return refreshing.promise;
  const current = tokens;
  if (!current) return null;
  const promise = (async () => {
    try {
      const response = await send('/auth/refresh', { method: 'POST', body: { refresh_token: current.refresh_token }, anonymous: true }, null);
      if (generation !== sessionGeneration) return null;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await expireSession(generation);
          return null;
        }
        // A server outage or rate limit is not an expired session.
        throw await failureOf(response);
      }
      const next = (await response.json()) as TokenPair;
      if (generation !== sessionGeneration) return null;
      await persistTokens(next);
      return next;
    } finally {
      if (refreshing?.generation === generation) refreshing = null;
    }
  })();
  refreshing = { generation, promise };
  return promise;
}

async function failureOf(response: Response): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === 'string') detail = body.detail;
  } catch {
    // A non-JSON error body is still an error; the status carries the meaning.
  }
  return new ApiError(response.status, detail, detail ?? `Request failed (${response.status})`);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!hasApi) throw new NetworkError('EXPO_PUBLIC_API_URL is not set.');
  const current = options.anonymous ? null : (await loadTokens())?.access_token ?? null;
  const generation = sessionGeneration;
  let response = await send(path, options, current);

  // Exactly one retry, and only for the one condition refreshing can fix.
  if (response.status === 401 && !options.anonymous) {
    // Another request may already have refreshed this same session.
    const next = generation === sessionGeneration && tokens?.access_token !== current
      ? tokens
      : await refreshTokens(generation);
    if (!next) throw await failureOf(response);
    response = await send(path, options, next.access_token);
    if (response.status === 401) await expireSession(generation);
  }

  if (!response.ok) throw await failureOf(response);
  const data = response.status === 204 ? undefined : await response.json();
  if (!options.anonymous && generation !== sessionGeneration) {
    // A response from before sign-out must not refill the signed-out store or
    // overwrite the next person's data.
    throw new NetworkError('The session changed during the request.');
  }
  return data as T;
}
