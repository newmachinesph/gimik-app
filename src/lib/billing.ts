import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { request } from '@/lib/api/client';
import { useApp } from '@/store';

type Subscription = { tier: 'free' | 'plus'; plus_until: string | null };
type SDK = typeof import('react-native-purchases').default;
let sdk: SDK | undefined;
let identity: string | null = null;
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;

export function billingKey(platform: string, android?: string, ios?: string): string | null {
  const key = platform === 'android' ? android : platform === 'ios' ? ios : undefined;
  const prefix = platform === 'android' ? 'goog_' : 'appl_';
  return key?.startsWith(prefix) && key.length > prefix.length ? key : null;
}

function currentUser(): string | null {
  const state = useApp.getState();
  return state.source === 'api' ? state.profile.id ?? null : null;
}

function serialized<T>(action: () => Promise<T>): Promise<T> {
  const pending = queue.then(action);
  queue = pending.catch(() => undefined);
  return pending;
}

/** Invalidate in-flight work immediately, then sign the native SDK out in order. */
export function resetBillingSession(): void {
  generation += 1;
  void serialized(async () => {
    if (sdk && identity) {
      await sdk.logOut();
      identity = null;
    }
  }).catch(() => undefined);
}

async function forUser<T>(action: (purchases: SDK, check: () => void) => Promise<T>): Promise<T> {
  const userId = currentUser();
  const expectedGeneration = generation;
  const check = () => {
    if (!userId || currentUser() !== userId || expectedGeneration !== generation) {
      throw new Error('Please sign in again before managing your subscription.');
    }
  };
  return serialized(async () => {
    check();
    const apiKey = billingKey(Platform.OS,
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
    if (!apiKey || Constants.appOwnership === 'expo') {
      throw new Error('Subscriptions are available in the Gimik Android and iPhone apps once store setup is complete.');
    }
    if (!sdk) {
      const purchases = (await import('react-native-purchases')).default;
      check();
      purchases.configure({ apiKey, appUserID: userId! });
      sdk = purchases;
      identity = userId;
    } else if (identity !== userId) {
      await sdk.logIn(userId!);
      identity = userId;
    }
    check();
    const result = await action(sdk, check);
    check();
    return result;
  });
}

export async function syncSubscription(): Promise<Subscription> {
  const userId = currentUser();
  const expectedGeneration = generation;
  if (!userId) throw new Error('Sign in to manage your subscription.');
  const result = await request<Subscription>('/billing/sync', { method: 'POST' });
  if (currentUser() !== userId || generation !== expectedGeneration) throw new Error('Your account changed. Please try again.');
  useApp.getState().updateProfile({ tier: result.tier, plusUntil: result.plus_until });
  return result;
}

export async function monthlyOffering(): Promise<PurchasesPackage | null> {
  return forUser(async (purchases) => {
    const offerings = await purchases.getOfferings();
    const monthly = offerings.current?.monthly;
    const expected = Platform.OS === 'android' ? 'gimik_plus:monthly' : 'gimik_plus_monthly';
    // Never silently sell a different package or period after a dashboard edit.
    return monthly?.product.identifier === expected && monthly.product.subscriptionPeriod === 'P1M' ? monthly : null;
  });
}

export async function purchaseMonthly(pack: PurchasesPackage): Promise<Subscription> {
  return forUser(async (purchases, check) => {
    const expected = Platform.OS === 'android' ? 'gimik_plus:monthly' : 'gimik_plus_monthly';
    if (pack.identifier !== '$rc_monthly' || pack.product.identifier !== expected || pack.product.subscriptionPeriod !== 'P1M') {
      throw new Error('The monthly subscription is not available. Please reload.');
    }
    await purchases.purchasePackage(pack);
    check();
    // A successful SDK purchase is not permission to grant backend access.
    return syncSubscription();
  });
}

export async function restorePurchases(): Promise<Subscription> {
  return forUser(async (purchases, check) => {
    await purchases.restorePurchases();
    check();
    return syncSubscription();
  });
}

export function purchaseCancelled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'userCancelled' in error && error.userCancelled === true;
}
