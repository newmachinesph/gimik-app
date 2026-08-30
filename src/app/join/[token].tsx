import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';

import { EmptyState, PrimaryButton, Screen, TopBar, Txt } from '@/components/ui';
import { joinGroup as join } from '@/lib/actions';
import { useApp } from '@/store';

/** A group link opened on this device. Whoever opens it is in. */
export default function Join() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const group = useApp((s) => s.groups.find((item) => item.inviteToken === token));
  return (
    <Screen inset={false}>
      <TopBar title="" />
      {group ? (
        <>
          <Txt variant="eyebrow">{t('s.join.invited')}</Txt>
          <Txt variant="title" className="mt-1 mb-6">{group.name}</Txt>
          <PrimaryButton label={t('s.join.join')} icon="arrow-right" onPress={() => { join(token ?? ''); toast(t('s.toasts.groupJoined', { name: group.name })); router.replace(`/groups/${group.id}` as never); }} />
        </>
      ) : <EmptyState icon="warning" title={t('s.join.expired.title')} body={t('s.join.expired.body')} />}
    </Screen>
  );
}
