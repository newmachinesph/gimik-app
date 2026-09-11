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
let refreshing: Promise<TokenPair | null> | null = null;

export async function loadTokens(): Promise<TokenPair | null> {
  if (tokens) return tokens;
  const raw = await AsyncStorage.getItem(TOKEN_KEY);
  tokens = raw ? (JSON.parse(raw) as TokenPair) : null;
  return tokens;
}

export async function setTokens(next: TokenPair | null): Promise<void> {
  tokens = next;
  if (next) await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(next));
  else await AsyncStorage.removeItem(TOKEN_KEY);
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
async function refreshTokens(): Promise<TokenPair | null> {
  if (refreshing) return refreshing;
  const current = tokens;
  if (!current) return null;
  refreshing = (async () => {
    try {
      const response = await send('/auth/refresh', { method: 'POST', body: { refresh_token: current.refresh_token }, anonymous: true }, null);
      if (!response.ok) {
        await setTokens(null);
        return null;
      }
      const next = (await response.json()) as TokenPair;
      await setTokens(next);
      return next;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
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
  let response = await send(path, options, current);

  // Exactly one retry, and only for the one condition refreshing can fix.
  if (response.status === 401 && !options.anonymous) {
    const next = await refreshTokens();
    if (!next) throw await failureOf(response);
    response = await send(path, options, next.access_token);
  }

  if (!response.ok) throw await failureOf(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
