import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { toast } from 'sonner-native';

import { EmptyState, PrimaryButton, Screen, TopBar, Txt } from '@/components/ui';
import { joinGroup as join } from '@/lib/actions';
import { useApp } from '@/store';

/** A group link opened on this device. Whoever opens it is in. */
export default function Join() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const group = useApp((s) => s.groups.find((item) => item.inviteToken === token));
  const [joining, setJoining] = useState(false);
  const accept = async () => {
    if (!token || joining) return;
    setJoining(true);
    const joined = await join(token);
    setJoining(false);
    if (joined) {
      toast(t('s.toasts.groupJoined', { name: group?.name ?? t('s.groups.title') }));
      router.replace(`/groups/${joined.id}` as never);
    }
  };
  return (
    <Screen inset={false}>
      <TopBar title="" />
      {/* The name is only known once you are in - there is no preview of a
          group you have not joined. So a known group means you are already a
          member, and an unknown one gets a neutral title, never "Groups". */}
      {token && group ? (
        <>
          <Txt variant="eyebrow">{t('s.join.alreadyIn')}</Txt>
          <Txt variant="title" className="mt-1 mb-6">{group.name}</Txt>
          <PrimaryButton label={t('s.join.open')} icon="arrow-right" onPress={() => router.replace(`/groups/${group.id}` as never)} />
        </>
      ) : token ? (
        <>
          <Txt variant="eyebrow">{t('s.join.invited')}</Txt>
          <Txt variant="title" className="mt-1 mb-6">{t('s.join.aGroup')}</Txt>
          <PrimaryButton label={t('s.join.join')} icon="arrow-right" disabled={joining} state={joining ? 'loading' : 'idle'} onPress={() => void accept()} />
        </>
      ) : <EmptyState icon="warning" title={t('s.join.expired.title')} body={t('s.join.expired.body')} />}
    </Screen>
  );
}
