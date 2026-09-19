import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  configure: vi.fn(), logIn: vi.fn(), logOut: vi.fn(), getOfferings: vi.fn(),
  purchasePackage: vi.fn(), restorePurchases: vi.fn(), request: vi.fn(),
  platform: { OS: 'android' }, constants: { appOwnership: 'standalone' },
}));
vi.mock('react-native', () => ({ Platform: mocks.platform }));
vi.mock('expo-constants', () => ({ default: mocks.constants }));
vi.mock('react-native-purchases', () => ({ default: mocks }));
vi.mock('@/lib/api/client', () => ({ request: mocks.request }));

const pack = { identifier: '$rc_monthly', product: { identifier: 'gimik_plus:monthly', subscriptionPeriod: 'P1M' } };
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.platform.OS = 'android';
  mocks.constants.appOwnership = 'standalone';
  vi.stubEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', 'goog_public-test');
  mocks.getOfferings.mockResolvedValue({ current: { monthly: pack } });
  mocks.request.mockResolvedValue({ tier: 'plus', plus_until: '2099-01-01T00:00:00Z' });
});
afterEach(() => vi.unstubAllEnvs());

async function setup() {
  const { useApp } = await import('@/store');
  await useApp.persist.rehydrate();
  useApp.getState().loadServer({ profile: { ...useApp.getState().profile, id: 'account-a', tier: 'free' } });
  return { useApp, ...await import('./billing') };
}

it('accepts only the correct public store key, never secret/test/cross-platform keys', async () => {
  const { billingKey } = await setup();
  expect(billingKey('android', 'goog_public')).toBe('goog_public');
  expect(billingKey('ios', '', 'appl_public')).toBe('appl_public');
  for (const key of ['sk_secret', 'test_key', 'appl_wrong', '', 'goog_']) expect(billingKey('android', key)).toBeNull();
  expect(billingKey('web', 'goog_public', 'appl_public')).toBeNull();
});

it('configures a stable account ID once and filters unexpected offerings', async () => {
  const b = await setup();
  expect(await b.monthlyOffering()).toEqual(pack);
  await b.monthlyOffering();
  expect(mocks.configure).toHaveBeenCalledOnce();
  expect(mocks.configure).toHaveBeenCalledWith({ apiKey: 'goog_public-test', appUserID: 'account-a' });
  mocks.getOfferings.mockResolvedValue({ current: { monthly: { ...pack, product: { identifier: 'another-product' } } } });
  expect(await b.monthlyOffering()).toBeNull();
});

it('does not configure or buy for demo, web or Expo Go', async () => {
  const b = await setup();
  mocks.platform.OS = 'web';
  await expect(b.monthlyOffering()).rejects.toThrow('Subscriptions are available');
  mocks.platform.OS = 'android';
  mocks.constants.appOwnership = 'expo';
  await expect(b.monthlyOffering()).rejects.toThrow('Subscriptions are available');
  b.useApp.getState().reset();
  await expect(b.monthlyOffering()).rejects.toThrow('sign in');
  expect(mocks.configure).not.toHaveBeenCalled();
});

it('grants UI status only from authenticated backend verification after purchase', async () => {
  const b = await setup();
  await b.purchaseMonthly((await b.monthlyOffering())!);
  expect(mocks.purchasePackage).toHaveBeenCalledWith(pack);
  expect(mocks.request).toHaveBeenCalledWith('/billing/sync', { method: 'POST' });
  expect(b.useApp.getState().profile.tier).toBe('plus');
});

it('does not unlock if backend verification fails', async () => {
  const b = await setup();
  mocks.request.mockRejectedValue(new Error('Offline'));
  await expect(b.purchaseMonthly((await b.monthlyOffering())!)).rejects.toThrow('Offline');
  expect(b.useApp.getState().profile.tier).toBe('free');
});

it('restores through the store and backend; cancellation never syncs', async () => {
  const b = await setup();
  await b.restorePurchases();
  expect(mocks.restorePurchases).toHaveBeenCalledOnce();
  mocks.request.mockClear();
  mocks.purchasePackage.mockRejectedValue({ userCancelled: true });
  await expect(b.purchaseMonthly((await b.monthlyOffering())!)).rejects.toEqual({ userCancelled: true });
  expect(mocks.request).not.toHaveBeenCalled();
  expect(b.purchaseCancelled({ userCancelled: true })).toBe(true);
  expect(b.purchaseCancelled(new Error())).toBe(false);
});

it('discards an in-flight purchase after sign-out and logs out the SDK', async () => {
  const b = await setup();
  mocks.purchasePackage.mockImplementation(async () => {
    b.resetBillingSession();
    b.useApp.getState().reset();
  });
  await expect(b.purchaseMonthly((await b.monthlyOffering())!)).rejects.toThrow('sign in');
  await vi.waitFor(() => expect(mocks.logOut).toHaveBeenCalledOnce());
  expect(mocks.request).not.toHaveBeenCalled();
});

it('switches native identity before offering purchases to another account', async () => {
  const b = await setup();
  await b.monthlyOffering();
  b.useApp.getState().updateProfile({ id: 'account-b' });
  await b.monthlyOffering();
  expect(mocks.logIn).toHaveBeenCalledWith('account-b');
});

it('discards an in-flight backend result after account changes', async () => {
  const b = await setup();
  mocks.request.mockImplementation(async () => {
    b.useApp.getState().updateProfile({ id: 'account-b' });
    return { tier: 'plus', plus_until: '2099-01-01T00:00:00Z' };
  });
  await expect(b.syncSubscription()).rejects.toThrow('account changed');
  expect(b.useApp.getState().profile.tier).toBe('free');
});
