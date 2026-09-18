import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pair = { access_token: 'access-old', refresh_token: 'refresh-old', token_type: 'bearer' };
const renewed = { access_token: 'access-new', refresh_token: 'refresh-new', token_type: 'bearer' };
const reply = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'https://api.example.test');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function setup() {
  const client = await import('./client');
  await client.setTokens(pair);
  const expired = vi.fn();
  client.onSessionExpired(expired);
  return { ...client, expired };
}

describe('authenticated transport', () => {
  it('refreshes once and retries with the replacement access token', async () => {
    const c = await setup();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, renewed))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    vi.stubGlobal('fetch', fetcher);
    await expect(c.request('/auth/me')).resolves.toEqual({ ok: true });
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe('Bearer access-new');
    expect(await c.loadTokens()).toEqual(renewed);
    expect(c.expired).not.toHaveBeenCalled();
  });

  it.each([401, 403])('clears credentials and emits expiry for refresh rejection %s', async (status) => {
    const c = await setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(401)).mockResolvedValueOnce(reply(status)));
    await expect(c.request('/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(await c.loadTokens()).toBeNull();
    expect(c.expired).toHaveBeenCalledOnce();
    const storage = (await import('@react-native-async-storage/async-storage')).default;
    expect(await storage.getItem('gimik-v2-tokens')).toBeNull();
  });

  it('expires when even the refreshed access token is rejected', async () => {
    const c = await setup();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, renewed))
      .mockResolvedValueOnce(reply(401)));
    await expect(c.request('/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(await c.loadTokens()).toBeNull();
    expect(c.expired).toHaveBeenCalledOnce();
  });

  it.each([429, 500, 503])('keeps credentials when refresh temporarily returns %s', async (status) => {
    const c = await setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(401)).mockResolvedValueOnce(reply(status)));
    await expect(c.request('/auth/me')).rejects.toMatchObject({ status });
    expect(await c.loadTokens()).toEqual(pair);
    expect(c.expired).not.toHaveBeenCalled();
  });

  it('keeps credentials when the refresh request is offline', async () => {
    const c = await setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(reply(401)).mockRejectedValueOnce(new Error('offline')));
    await expect(c.request('/auth/me')).rejects.toBeInstanceOf(c.NetworkError);
    expect(await c.loadTokens()).toEqual(pair);
    expect(c.expired).not.toHaveBeenCalled();
  });

  it('does not expire a session for bad login credentials or a resource-specific 403', async () => {
    const c = await setup();
    const fetcher = vi.fn().mockResolvedValueOnce(reply(401)).mockResolvedValueOnce(reply(403));
    vi.stubGlobal('fetch', fetcher);
    await expect(c.request('/auth/login', { anonymous: true })).rejects.toMatchObject({ status: 401 });
    await expect(c.request('/private-resource')).rejects.toMatchObject({ status: 403 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(await c.loadTokens()).toEqual(pair);
    expect(c.expired).not.toHaveBeenCalled();
  });

  it('shares a refresh across concurrent requests', async () => {
    const c = await setup();
    const refresh = deferred<Response>();
    const fetcher = vi.fn((url: string, options: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return refresh.promise;
      const headers = options.headers as Record<string, string>;
      return Promise.resolve(reply(headers.Authorization === 'Bearer access-new' ? 200 : 401));
    });
    vi.stubGlobal('fetch', fetcher);
    const a = c.request('/one');
    const b = c.request('/two');
    await vi.waitFor(() => expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1));
    refresh.resolve(reply(200, renewed));
    await Promise.all([a, b]);
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(c.expired).not.toHaveBeenCalled();
  });

  it('cannot restore tokens when an in-flight refresh finishes after sign-out', async () => {
    const c = await setup();
    const refresh = deferred<Response>();
    const fetcher = vi.fn().mockResolvedValueOnce(reply(401)).mockReturnValueOnce(refresh.promise);
    vi.stubGlobal('fetch', fetcher);
    const pending = c.request('/auth/me');
    const rejected = expect(pending).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await c.setTokens(null);
    refresh.resolve(reply(200, renewed));
    await rejected;
    expect(await c.loadTokens()).toBeNull();
  });

  it('ignores a stale rejection after a different account signs in', async () => {
    const c = await setup();
    const response = deferred<Response>();
    const fetcher = vi.fn().mockReturnValueOnce(response.promise);
    vi.stubGlobal('fetch', fetcher);
    const pending = c.request('/auth/me');
    const rejected = expect(pending).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    await c.setTokens(renewed);
    response.resolve(reply(401));
    await rejected;
    expect(await c.loadTokens()).toEqual(renewed);
    expect(c.expired).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('does not expose stale successful responses after sign-out', async () => {
    const c = await setup();
    const response = deferred<Response>();
    const fetcher = vi.fn().mockReturnValueOnce(response.promise);
    vi.stubGlobal('fetch', fetcher);
    const pending = c.request('/auth/me');
    const rejected = expect(pending).rejects.toBeInstanceOf(c.NetworkError);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    await c.setTokens(null);
    response.resolve(reply(200, { name: 'Old account' }));
    await rejected;
  });

  it('checks the session again after a delayed response body is read', async () => {
    const c = await setup();
    const body = deferred<unknown>();
    const json = vi.fn(() => body.promise);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json }));
    const pending = c.request('/auth/me');
    const rejected = expect(pending).rejects.toBeInstanceOf(c.NetworkError);
    await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
    await c.setTokens(null);
    body.resolve({ name: 'Old account' });
    await rejected;
  });
});
