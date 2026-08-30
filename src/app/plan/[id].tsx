import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, View } from 'react-native';
import { toast } from 'sonner-native';

import { NotFound } from '@/components/not-found';
import { PeopleGrid } from '@/components/people-grid';
import {
  Chip,
  Field,
  FocusablePressable,
  GhostButton,
  GoraIcon,
  NavRow,
  PrimaryButton,
  RowList,
  Screen,
  Section,
  SectionHead,
  TopBar,
  Txt,
} from '@/components/ui';
import { markDone, openThread, unlock, updatePlan } from '@/lib/actions';
import { countdown, dayLabel } from '@/lib/format';
import { wantTitle } from '@/lib/mock';
import { wantById } from '@/lib/somedays';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

/** The plan: date, people, place, split, thread. Mark done from here. */
export default function PlanScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const want = wantById(id);
  const plan = useApp((s) => (id ? s.plans[id] : undefined));
  const threads = useApp((s) => s.threads);
  if (!want || !plan || !id) return <NotFound />;
  const thread = threads.find((item) => item.kind === 'plan' && item.refId === id);
  // Plans locked before the KKB vocabulary carry the old values; read them as
  // their nearest new word so a chip is always selected.
  const legacy: Record<string, typeof plan.split> = { 'own-tab': 'kkb', 'on-me': 'treat' };
  const split = legacy[plan.split as string] ?? plan.split;

  const done = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markDone(id);
    toast(t('s.toasts.done'));
    router.replace(`/journal/${id}` as never);
  };

  return (
    <Screen inset={false} footer={<PrimaryButton label={t('s.plan.didIt')} icon="success" onPress={done} />}>
      <TopBar title="" />
      <Txt variant="date">{countdown(plan.date)}</Txt>
      <Txt variant="title" className="mt-1" numberOfLines={2}>{wantTitle(want)}</Txt>
      <Txt variant="body" className="mt-1">{dayLabel(plan.date)}{plan.time ? ` · ${plan.time}` : ''}</Txt>
      {plan.place ? (
        // The place is an address, so let it behave like one: the phone's own
        // map app already knows what to do with it.
        <FocusablePressable
          accessibilityRole="button"
          accessibilityLabel={t('s.plan.openMap')}
          onPress={() => void Linking.openURL(`geo:0,0?q=${encodeURIComponent(plan.place ?? '')}`).catch(() => {})}
          className="flex-row items-center mt-2 active:opacity-70"
        >
          <GoraIcon name="map-pin" size={15} color={C.ink} weight="fill" />
          <Txt variant="label" className="text-brand-ink ml-2 flex-1" numberOfLines={1}>{plan.place}</Txt>
          <GoraIcon name="chevron-right" size={14} color={C.inkMuted} />
        </FocusablePressable>
      ) : null}

      <Section className="mt-6">
        <SectionHead title={t('s.plan.whosIn.title')} subtitle={plan.people.length ? t('s.plan.whosIn.subtitle', { count: plan.people.length }) : t('s.plan.whosIn.justYou')} />
        <PeopleGrid names={[t('s.common.you'), ...plan.people]} />
      </Section>

      <Section>
        <SectionHead title={t('s.plan.bill.title')} subtitle={t('s.plan.bill.subtitle')} />
        <View className="flex-row flex-wrap gap-2">
          {(['kkb', 'equal', 'treat', 'others'] as const).map((option) => (
            <Chip key={option} label={t(`s.plan.bill.${option}`)} selected={split === option} onPress={() => updatePlan(id, { split: option })} />
          ))}
        </View>
        {/* "Others" is the only answer that needs words after it. */}
        {split === 'others' ? (
          <View className="mt-3">
            <Field
              label={t('s.plan.bill.noteHint')}
              placeholder={t('s.plan.bill.notePh')}
              value={plan.splitNote ?? ''}
              onChangeText={(text) => updatePlan(id, { splitNote: text })}
            />
          </View>
        ) : null}
      </Section>

      <Section>
        <RowList>
          <NavRow
            icon="chat"
            title={t('s.plan.thread')}
            count={thread?.messages.length ?? 0}
            size="lg"
            onPress={() => { const th = thread ?? openThread('plan', id, wantTitle(want)); router.push(`/messages/${th.id}` as never); }}
          />
        </RowList>
      </Section>

      <GhostButton label={t('s.plan.unlock')} tone="muted" onPress={() => Alert.alert(t('s.plan.unlockTitle'), t('s.plan.unlockBody'), [{ text: t('s.plan.unlockKeep'), style: 'cancel' }, { text: t('s.plan.unlockConfirm'), style: 'destructive', onPress: () => { unlock(id); toast(t('s.toasts.unlocked')); router.back(); } }])} />
    </Screen>
  );
}
