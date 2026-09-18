import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hydrate: vi.fn(), disconnect: vi.fn(), resetDirectory: vi.fn(), resetRegistry: vi.fn(), resetPlaces: vi.fn(),
}));
vi.mock('./sync', () => ({ hydrateFromApi: mocks.hydrate }));
vi.mock('./google', () => ({ forgetGoogle: vi.fn(), getGoogleIdToken: vi.fn() }));
vi.mock('./push', () => ({ unregisterForPush: vi.fn() }));
vi.mock('./realtime', () => ({ disconnectRealtime: mocks.disconnect }));
vi.mock('./directory', () => ({ resetDirectory: mocks.resetDirectory }));
vi.mock('@/lib/registry', () => ({ resetRegistry: mocks.resetRegistry }));
vi.mock('@/lib/places', () => ({ resetPlaceCache: mocks.resetPlaces }));

const pair = { access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'bearer' };
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'https://api.example.test');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function setup(withTokens = true) {
  const client = await import('./client');
  if (withTokens) await client.setTokens(pair);
  const { useApp } = await import('@/store');
  await useApp.persist.rehydrate();
  useApp.getState().loadServer({ profile: { ...useApp.getState().profile, name: 'QA account' } });
  const session = await import('./session');
  return { client, useApp, ...session };
}

describe('session restoration and expiry', () => {
  it('clears a persisted account when there are no credentials', async () => {
    const s = await setup(false);
    await expect(s.restoreSession()).resolves.toBe(false);
    expect(s.useApp.getState().onboarded).toBe(false);
    expect(s.useApp.getState().profile.name).toBe('');
    expect(mocks.hydrate).not.toHaveBeenCalled();
  });

  it('clears cached identity, tokens and caches on cold-start rejection', async () => {
    const s = await setup();
    mocks.hydrate.mockRejectedValue(new s.client.ApiError(401, undefined, 'Revoked'));
    await expect(s.restoreSession()).resolves.toBe(false);
    expect(await s.client.loadTokens()).toBeNull();
    expect(s.useApp.getState().onboarded).toBe(false);
    expect(s.useApp.getState().profile.name).toBe('');
    expect(mocks.disconnect).toHaveBeenCalled();
    expect(mocks.resetDirectory).toHaveBeenCalled();
    expect(mocks.resetRegistry).toHaveBeenCalled();
    expect(mocks.resetPlaces).toHaveBeenCalled();
  });

  it.each(['offline', 'server', 'forbidden'])('preserves cached data and credentials for %s failures', async (kind) => {
    const s = await setup();
    const error = kind === 'offline'
      ? new s.client.NetworkError('Offline')
      : new s.client.ApiError(kind === 'server' ? 503 : 403, undefined, 'Unavailable');
    mocks.hydrate.mockRejectedValue(error);
    await expect(s.restoreSession()).resolves.toBe(true);
    expect(await s.client.loadTokens()).toEqual(pair);
    expect(s.useApp.getState().onboarded).toBe(true);
    expect(s.useApp.getState().profile.name).toBe('QA account');
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });

  it('invalidates the route guard from any screen when refresh is rejected', async () => {
    const s = await setup();
    const stop = s.watchSessionExpiry();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('{}', { status: 401 }))));
    await expect(s.client.request('/catalog/mine')).rejects.toMatchObject({ status: 401 });
    expect(s.useApp.getState().onboarded).toBe(false);
    expect(s.useApp.getState().source).toBe('demo');
    expect(s.useApp.getState().profile.name).toBe('');
    stop();
  });

  it('restores a valid session without resetting it', async () => {
    const s = await setup();
    mocks.hydrate.mockResolvedValue(undefined);
    await expect(s.restoreSession()).resolves.toBe(true);
    expect(await s.client.loadTokens()).toEqual(pair);
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });
});
