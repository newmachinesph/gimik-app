import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { NotFound } from '@/components/not-found';
import { VisibilityChips } from '@/components/visibility-chips';
import {
  Badge,
  Card,
  GhostButton,
  GoraIcon,
  IconButton,
  NavRow,
  PillButton,
  PrimaryButton,
  RowList,
  Section,
  SectionHead,
  StickyFooter,
  Txt,
} from '@/components/ui';
import { askPerson, keep, setVisibility, unkeep } from '@/lib/actions';
import { dayLabel } from '@/lib/format';
import { categoryLabel, wantLocationScope, wantNote, wantTitle } from '@/lib/mock';
import { genderMark } from '@/lib/people';
import { useHolders, useSomedayState, wantById } from '@/lib/somedays';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

/** The one place a someday is fully described. Every card opens it. */
export default function SomedayDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const want = wantById(id);
  const state = useSomedayState(id);
  const holders = useHolders(want);
  const plan = useApp((s) => (id ? s.plans[id] : undefined));
  const visibility = useApp((s) => (id ? s.visibility[id] : undefined) ?? s.defaultVisibility);

  if (!want || !id) return <NotFound />;
  const kept = state === 'kept' || state === 'locked' || state === 'done';
  const stateLine = state === 'locked' && plan
    ? t('s.want.stateLocked', { date: dayLabel(plan.date) })
    : state === 'done' ? t('s.want.stateDone') : kept ? t('s.want.stateKept') : t('s.want.stateNot');
  const place = want.place;

  const keepHere = () => {
    keep(id);
    toast(t('s.toasts.kept', { title: wantTitle(want) }), { action: { label: t('s.common.undo'), onClick: () => unkeep(id) } });
  };
  const share = () => void Share.share({ message: t('s.want.share', { title: wantTitle(want).toLowerCase(), url: `https://getgora.app/s/${want.slug ?? want.id}` }) });
  const openMap = () => {
    if (!place) return;
    const query = place.address ?? `${place.name}, ${place.area}`;
    void Linking.openURL(`geo:${place.latitude},${place.longitude}?q=${encodeURIComponent(query)}`).catch(() => {});
  };

  return (
    <View className="flex-1 bg-brand-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View className="h-[360px] bg-brand-paper-sunk">
          <Image source={want.photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
          <View className="absolute left-4 right-4 flex-row justify-between" style={{ top: insets.top + 8 }}>
            <IconButton icon="back" label={t('s.common.goBack')} tone="glass" onPress={() => router.back()} />
            <IconButton icon={kept ? 'success' : 'heart'} label={kept ? t('s.want.onList') : t('s.want.keepThis')} tone="glass" onPress={() => (kept ? unkeep(id) : keepHere())} />
          </View>
        </View>

        <View className="px-5 -mt-6">
          <Card className="p-5">
            <Txt variant="title">{wantTitle(want)}</Txt>
            <Txt variant="caption" className="mt-1">
              {categoryLabel(want.category)}{wantLocationScope(want) ? ` \u00B7 ${wantLocationScope(want)}` : ''}
            </Txt>
            <View className="flex-row items-center mt-3">
              <Badge label={stateLine} tone={state === 'locked' ? 'orange' : state === 'done' ? 'dark' : 'light'} size="sm" />
            </View>
            <Txt variant="body" className="mt-4">{wantNote(want) ?? t('s.want.noNote')}</Txt>
          </Card>

          {kept && state !== 'done' ? (
            <Section className="mt-6">
              <SectionHead title={t('s.want.whoCanInvite.title')} subtitle={t('s.want.whoCanInvite.subtitle')} />
              <Card className="p-4">
                <VisibilityChips value={visibility} onChange={(next) => setVisibility(id, next)} />
              </Card>
            </Section>
          ) : null}

          <Section className="mt-6">
            <SectionHead title={t('s.want.whosIn.title')} subtitle={holders.length ? t('s.want.whosIn.subtitle', { count: holders.length }) : t('s.want.whosIn.nobody')} />
            {holders.length ? (
              <RowList>
                {holders.map((person) => (
                  <NavRow
                    key={person!.name}
                    avatar={person!.name}
                    title={`${person!.name} ${genderMark(person!.gender)}`}
                    caption={person!.city}
                    onPress={() => router.push(`/person/${encodeURIComponent(person!.name)}` as never)}
                    chevron={false}
                    trailing={
                      // The other half of the invite loop: you can ask, not only be asked.
                      <PillButton
                        label={t('s.want.ask')}
                        accessibilityLabel={t('s.want.askPerson', { name: person!.name.split(' ')[0] })}
                        onPress={() => {
                          const thread = askPerson(person!.name, id, wantTitle(want), want.party === 'group' ? 'group' : 'duo');
                          toast(t('s.toasts.asked', { name: person!.name.split(' ')[0] }));
                          router.push(`/messages/${thread.id}` as never);
                        }}
                      />
                    }
                  />
                ))}
              </RowList>
            ) : (
              <Card className="p-4">
                <Txt variant="label" className="text-brand-ink">{t('s.want.first.title')}</Txt>
                <Txt variant="caption" className="mt-1">{t('s.want.first.body')}</Txt>
                <View className="mt-3"><GhostButton label={t('s.want.first.action')} tone="muted" onPress={share} /></View>
              </Card>
            )}
          </Section>

          {/* Below the fold, per the corpus: the note sits above, the map is
              the detail you go looking for rather than land on. */}

          {place ? (
            <Section>
              <SectionHead title={t('s.want.where.title')} subtitle={t('s.want.where.subtitle')} />
              <RowList>
                <NavRow
                  leading={<GoraIcon name="map-pin" size={20} color={C.ink} weight="fill" />}
                  title={place.name}
                  caption={place.address ?? place.area}
                  onPress={openMap}
                />
              </RowList>
            </Section>
          ) : null}
        </View>
      </ScrollView>

      <StickyFooter>
        {state === 'done' ? (
          <PrimaryButton label={t('s.want.openJournal')} icon="arrow-right" onPress={() => router.push(`/journal/${id}` as never)} />
        ) : state === 'locked' ? (
          <PrimaryButton label={t('s.want.openPlan')} icon="calendar" onPress={() => router.push(`/plan/${id}` as never)} />
        ) : kept ? (
          <PrimaryButton label={t('s.want.lockDate')} icon="lock" onPress={() => router.push(`/lock/${id}` as never)} />
        ) : (
          <PrimaryButton label={t('s.want.keepThis')} icon="heart" onPress={keepHere} />
        )}
      </StickyFooter>
    </View>
  );
}
