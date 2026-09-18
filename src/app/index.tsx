import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { LoadingState } from '@/components/ui';
import { hasApi, restoreSession } from '@/lib/api/session';
import { useApp } from '@/store';

/**
 * Boot gate: the only place that decides the first screen.
 *
 * With a server configured, a stored token is worth more than the persisted
 * store - it can refill it with what is true now - so the gate waits on one
 * hydration attempt before choosing. Without a server it decides immediately,
 * which is what keeps the demo build instant.
 */
export default function Boot() {
  const onboarded = useApp((state) => state.onboarded);
  const [restoring, setRestoring] = useState(hasApi);

  useEffect(() => {
    if (!restoring) return;
    let live = true;
    void restoreSession().finally(() => {
      if (live) setRestoring(false);
    });
    return () => {
      live = false;
    };
    // Runs once: a re-run would refetch the world on every render.
  }, [restoring]);

  if (restoring) {
    return (
      <View className="flex-1 bg-brand-paper items-center justify-center">
        <LoadingState />
      </View>
    );
  }
  return <Redirect href={onboarded ? '/(tabs)/home' : '/welcome'} />;
}
