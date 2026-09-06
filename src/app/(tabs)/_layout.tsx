import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useTranslation } from 'react-i18next';

import { OpeningSheet } from '@/components/opening-sheet';
import { TabBar, TabButton } from '@/components/tab-bar';
import { registerForPush } from '@/lib/api/push';
import { connectRealtime, disconnectRealtime } from '@/lib/api/realtime';
import { useProfileCompleteness } from '@/lib/completeness';
import { isInviteLive } from '@/lib/invites';
import { useApp } from '@/store';
import { useEffect } from 'react';

// Five destinations in the order of the journey: find, track, decide, people,
// me. The deck sits in the middle because deciding is the habit.
export default function TabsLayout() {
  const { t } = useTranslation();
  const profile = useApp((state) => state.profile);
  const newInvites = useApp((state) => state.invites.filter((invite) => invite.status === 'new' && isInviteLive(invite)).length);
  const { fraction } = useProfileCompleteness();
  const source = useApp((state) => state.source);

  // Live updates belong to the signed-in shell: opened once behind the tabs,
  // closed when the account goes away. Demo builds never connect.
  useEffect(() => {
    if (source !== 'api') return;
    void connectRealtime();
    // After sign-in rather than at launch: a cold permission prompt on first
    // open is the one people decline without reading.
    void registerForPush();
    return () => disconnectRealtime();
  }, [source]);

  return (
    <Tabs>
      <TabSlot />
      <OpeningSheet />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="discover" href="/discover" asChild>
            <TabButton icon="compass">{t('core.tabs.discover')}</TabButton>
          </TabTrigger>
          <TabTrigger name="activity" href="/activity" asChild>
            <TabButton icon="bell">{t('core.tabs.activity')}</TabButton>
          </TabTrigger>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton icon="cards">{t('core.tabs.home')}</TabButton>
          </TabTrigger>
          <TabTrigger name="invites" href="/invites" asChild>
            <TabButton icon="heart" badge={newInvites}>{t('core.tabs.invites')}</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="profile" avatar={profile.name || t('core.common.goraMember')} photo={profile.photos[0]} progress={fraction}>
              {t('core.tabs.profile')}
            </TabButton>
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}