import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { Button, Screen, TopBar, Txt } from '@/components/ui';
import { monthlyOffering, purchaseCancelled, purchaseMonthly, restorePurchases, syncSubscription } from '@/lib/billing';
import { SITE_URL } from '@/lib/links';
import { useApp } from '@/store';

/** Compact, functionalist layout using Gimik's existing editorial tokens. */
export default function Plus() {
  const tier = useApp((state) => state.profile.tier);
  const expiry = useApp((state) => state.profile.plusUntil);
  const [now, setNow] = useState(Date.now);
  const active = tier === 'plus' && Boolean(expiry && Date.parse(expiry) > now);
  const [pack, setPack] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const [offering] = await Promise.all([monthlyOffering(), syncSubscription()]);
      if (mounted.current) {
        setPack(offering);
        if (!offering) setMessage('The monthly plan is not available in the store yet. Please check back soon.');
      }
    } catch {
      if (mounted.current) setMessage('Subscriptions are not ready or the store could not be reached. Please try again later.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Store/network fetch: state updates happen only after asynchronous results.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => { mounted.current = false; clearInterval(timer); };
  }, [load]);

  const run = async (restore: boolean) => {
    if (lock.current || (!restore && !pack)) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = restore ? await restorePurchases() : await purchaseMonthly(pack!);
      if (mounted.current) setMessage(result.tier === 'plus'
        ? 'Gimik Plus is active. You’re ready to plan.'
        : restore ? 'No active Plus subscription was found for this account.'
          : 'Your purchase is being verified. Use Restore purchases to check again; do not purchase twice.');
    } catch (error) {
      if (mounted.current && !purchaseCancelled(error)) setMessage(restore
        ? 'Could not restore purchases. Please try again.'
        : 'Checkout or verification could not finish. If the store charged you, use Restore purchases; do not purchase twice.');
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const open = (url: string) => {
    void Linking.openURL(url).catch(() => setMessage('Could not open this link. Please try again.'));
  };

  return (
    <Screen inset={false}>
      <TopBar title="Gimik Plus" />
      <View className="gap-4">
        <View className="gap-2">
          <Txt variant="title" headingLevel={2}>{active ? 'You’re on Plus.' : 'More room for your plans.'}</Txt>
          <Txt>Free activity suggestions stay free. Plus adds live Google Maps place search when you need somewhere more specific.</Txt>
        </View>
        <View className="gap-2 border-y border-brand-rule py-4">
          <Txt>Live place search with coordinates</Txt>
          <Txt>Create groups for shared plans</Txt>
          <Txt>More invites and up to 8 profile photos</Txt>
        </View>
        {!active ? (
          <View className="gap-2">
            <Txt variant="heading">{pack ? `${pack.product.priceString} / month` : 'Monthly subscription'}</Txt>
            <Button label={pack ? `Subscribe · ${pack.product.priceString} / month` : 'Not available yet'}
              state={loading || busy ? 'loading' : 'idle'} disabled={!pack || loading || busy} onPress={() => { void run(false); }} />
            <Txt variant="caption">Payment is charged to your store account. Renews monthly unless canceled in your store’s subscription settings. No free trial is offered.</Txt>
          </View>
        ) : <Txt>Your subscription is verified. Manage renewal or cancellation in the store where you purchased it.</Txt>}
        {message ? <Txt accessibilityLiveRegion="polite">{message}</Txt> : null}
        <Button label="Restore purchases" variant="secondary" disabled={busy || loading} onPress={() => { void run(true); }} />
        {!active && !pack ? <Button label="Try again" variant="ghost" disabled={busy || loading} onPress={() => { setLoading(true); setMessage(''); void load(); }} /> : null}
        {Platform.OS !== 'web' ? <Button label="Manage subscriptions" variant="ghost" disabled={busy}
          onPress={() => open(Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions')} /> : null}
        <View className="flex-row">
          <View className="flex-1"><Button label="Privacy" variant="ghost" onPress={() => open(`${SITE_URL}/privacy`)} /></View>
          <View className="flex-1"><Button label="Terms" variant="ghost" onPress={() => open(`${SITE_URL}/terms`)} /></View>
        </View>
      </View>
    </Screen>
  );
}
