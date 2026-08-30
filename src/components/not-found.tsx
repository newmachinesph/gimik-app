import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, TopBar } from '@/components/ui';

/**
 * A record that is not there.
 *
 * Every detail screen used to `return null` for this, which paints a blank
 * page with no way off it but the system back gesture. That was survivable
 * when all data was local and total; against a server a row can be deleted,
 * belong to someone else, or simply not have arrived yet, so the case needs a
 * surface and an exit.
 */
export function NotFound() {
  const { t } = useTranslation();
  return (
    <Screen inset={false}>
      <TopBar title="" />
      <EmptyState
        icon="warning"
        title={t('s.missing.title')}
        body={t('s.missing.body')}
        action={t('s.missing.action')}
        onAction={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home' as never))}
      />
    </Screen>
  );
}
