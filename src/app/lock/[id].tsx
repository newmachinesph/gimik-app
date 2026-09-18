import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { NotFound } from '@/components/not-found';
import { PeopleGrid } from '@/components/people-grid';
import { PlaceField } from '@/components/place-field';
import {
  Chip,
  FocusablePressable,
  PrimaryButton,
  Screen,
  Section,
  SectionHead,
  TopBar,
  Txt,
} from '@/components/ui';
import { lock } from '@/lib/actions';
import { dayLabel } from '@/lib/format';
import { formatDate } from '@/i18n/format';
import { wantTitle } from '@/lib/mock';
import { useHolders, wantById } from '@/lib/somedays';
import { useApp } from '@/store';

/** Lock: pick a date, pick who. Then the plan. */
export default function Lock() {
  const { t } = useTranslation();
  const { id, with: withName, date: proposed } = useLocalSearchParams<{ id: string; with?: string; date?: string }>();
  const want = wantById(id);
  const holders = useHolders(want);
  const friends = useApp((s) => s.friends);
  const [date, setDate] = useState<string | null>(proposed ?? null);
  const [time, setTime] = useState<string | null>(null);
  const [place, setPlace] = useState('');
  const [people, setPeople] = useState<string[]>(withName ? [decodeURIComponent(withName)] : []);

  const days = useMemo(() => Array.from({ length: 21 }, (_, offset) => { const d = new Date(); d.setDate(d.getDate() + 1 + offset); return d.toISOString().slice(0, 10); }), []);
  const candidates = useMemo(() => [...new Set([...people, ...friends, ...holders.map((person) => person!.name)])], [friends, holders, people]);
  if (!want || !id) return <NotFound />;

  const slots = [
    { value: 'Morning', label: t('s.lock.morning') },
    { value: 'Afternoon', label: t('s.lock.afternoon') },
    { value: 'Evening', label: t('s.lock.evening') },
  ];

  const confirm = () => {
    if (!date) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    lock({ wantId: id, date, time: time ?? undefined, place: place || undefined, people, split: 'kkb', confirmed: [] });
    toast(t('s.toasts.locked', { date: dayLabel(date) }));
    router.replace(`/plan/${id}` as never);
  };

  return (
    <Screen inset={false} scroll={false} footer={<PrimaryButton label={date ? t('s.lock.lockDay', { date: dayLabel(date) }) : t('s.lock.pickDay')} icon="lock" disabled={!date} onPress={confirm} />}>
      <TopBar title="" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Txt variant="eyebrow">{t('s.lock.eyebrow')}</Txt>
        <Txt variant="title" className="mt-1" numberOfLines={2}>{wantTitle(want)}</Txt>
        <Section className="mt-6">
          <SectionHead title={t('s.lock.when.title')} subtitle={t('s.lock.when.subtitle')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {days.map((iso) => {
              const selected = iso === date; const d = new Date(`${iso}T00:00:00`);
              return (
                <FocusablePressable key={iso} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setDate(iso)} className={`w-16 py-3 rounded-[4px] items-center border active:opacity-75 ${selected ? 'bg-brand-night border-brand-night' : 'border-brand-rule'}`}>
                  <Txt variant="eyebrow" className={selected ? 'text-brand-paper' : ''}>{formatDate(d, { weekday: 'short' }).toUpperCase()}</Txt>
                  <Txt variant="heading" className={`mt-1 ${selected ? 'text-brand-paper' : ''}`}>{d.getDate()}</Txt>
                </FocusablePressable>
              );
            })}
          </ScrollView>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {slots.map((slot) => <Chip key={slot.value} label={slot.label} selected={time === slot.value} onPress={() => setTime(time === slot.value ? null : slot.value)} />)}
          </View>
        </Section>
        <Section>
          <SectionHead title={t('s.place.title')} subtitle={t('s.place.subtitle')} />
          <PlaceField value={place} onChange={setPlace} />
        </Section>
        <Section>
          <SectionHead title={t('s.lock.who.title')} subtitle={people.length ? t('s.lock.who.subtitle', { count: people.length }) : t('s.lock.who.justYou')} />
          <PeopleGrid
            names={candidates}
            selected={people}
            onToggle={(name) => setPeople((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]))}
          />
        </Section>
      </ScrollView>
    </Screen>
  );
}
