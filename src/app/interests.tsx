import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';

import { InterestBank } from '@/components/interest-bank';
import { PrimaryButton, Screen, TopBar } from '@/components/ui';
import { updateProfile as update } from '@/lib/actions';
import { useApp } from '@/store';

/** The full bank, one screen: pick up to ten, wear them everywhere. */
export default function Interests() {
  const { t } = useTranslation();
  // Select the raw value: a `?? []` inside the selector makes a fresh array on
  // every snapshot, which zustand reads as endless change - an infinite loop.
  const saved = useApp((s) => s.profile.interests);
  const [selected, setSelected] = useState<string[]>(saved ?? []);
  return (
    <Screen inset={false} footer={<PrimaryButton label={t('s.common.save')} onPress={() => { update({ interests: selected }); toast(t('s.toasts.interestsSaved')); router.back(); }} />}>
      <TopBar title={t('s.interests.title')} />
      <InterestBank selected={selected} onChange={setSelected} />
    </Screen>
  );
}
