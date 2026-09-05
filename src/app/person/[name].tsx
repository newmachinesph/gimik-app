import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { NotFound } from '@/components/not-found';
import { ReportSheet } from '@/components/report-sheet';
import { SomedayRow } from '@/components/someday-row';
import {
  BrandedImage,
  GhostButton,
  GoraIcon,
  IconButton,
  NavRow,
  PhotoGallery,
  PillButton,
  PrimaryButton,
  RowList,
  SecondaryButton,
  Section,
  SectionHead,
  StickyFooter,
  Tag,
  Txt,
} from '@/components/ui';
import { formatDate } from '@/i18n/format';
import { askPerson, hidePerson, keep, openThread, reportPerson, requestFriend, unhidePerson, unkeep } from '@/lib/actions';
import { categoryBadge } from '@/lib/interests';
import { wantTitle } from '@/lib/mock';
import { genderMark, photosOf } from '@/lib/people';
import { usePerson } from '@/lib/person';
import { languageLabel } from '@/lib/profile-options';
import { CATALOG_FALLBACK } from '@/lib/storage';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

const SPEAKS = '\u{1F5E3}';

/** A person joined when their id says they did: stable across renders, never a slot machine. */
function memberSince(id: string): Date {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  const monthsAgo = 4 + (hash % 20);
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

/** The public face of someone in the seeded world. Photos first, then the overlap. */
export default function PersonProfile() {
  const { t } = useTranslation();
  const { name: raw } = useLocalSearchParams<{ name: string }>();
  const name = decodeURIComponent(raw ?? '');
  const insets = useSafeAreaInsets();
  const { person, somedays: theirs, loading: personLoading } = usePerson(name);
  const keptIds = useApp((s) => s.keptIds);
  const friends = useApp((s) => s.friends);
  const sent = useApp((s) => s.sentRequests);
  const [reporting, setReporting] = useState(false);


  const photos = useMemo(() => (person ? photosOf(person) : []), [person]);
  const common = theirs.filter((want) => keptIds.includes(want.id));
  const rest = theirs.filter((want) => !keptIds.includes(want.id)).slice(0, 8);
  if (!person) return <NotFound />;
  const isFriend = friends.includes(person.name);
  const requested = sent.includes(person.name);
  const first = person.name.split(' ')[0];

  const sendRequest = () => { requestFriend(person.name); toast(t('s.toasts.requestSent', { name: first })); };
  const hide = () => {
    hidePerson(person.name);
    router.back();
    toast(t('s.toasts.hidden', { name: first }), {
      action: { label: t('s.common.undo'), onClick: () => { unhidePerson(person.name); toast(t('s.toasts.unhidden', { name: first })); } },
    });
  };

  return (
    <View className="flex-1 bg-brand-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Photos first, as the corpus has it: the person before the overlap. */}
        <PhotoGallery photos={photos} name={person.name} height={440} />
        <View className="absolute left-4" style={{ top: insets.top + 8 }}>
          <IconButton icon="back" label={t('s.common.goBack')} tone={photos.length ? 'glass' : 'light'} onPress={() => router.back()} />
        </View>

        <View className="items-center px-5 pt-5 pb-6">
          <Txt variant="title">{person.name}, {person.age} {genderMark(person.gender)}</Txt>
          <Txt variant="label" className="mt-1">
            {person.city}{person.hometown && person.hometown !== person.city ? ` \u00B7 ${t('s.profile.from', { name: person.hometown })}` : ''}
          </Txt>
          <Txt variant="body" className="mt-3 text-center max-w-[300px]">{person.bio}</Txt>
          <View className="mt-3" style={{ gap: 6 }}>
            {person.work ? (
              <View className="flex-row items-center justify-center">
                <GoraIcon name="work" size={15} color={C.inkMuted} />
                <Txt variant="label" className="ml-2" numberOfLines={1}>{person.work}</Txt>
              </View>
            ) : null}
            {person.education ? (
              <View className="flex-row items-center justify-center">
                <GoraIcon name="education" size={15} color={C.inkMuted} />
                <Txt variant="label" className="ml-2" numberOfLines={1}>{person.education}</Txt>
              </View>
            ) : null}
          </View>
          <View className="flex-row flex-wrap justify-center mt-3" style={{ gap: 6, maxWidth: 330 }}>
            {person.leans.map((lean) => <Tag key={lean} label={categoryBadge(lean)} />)}
            {person.languages.map((slug) => {
              const label = languageLabel(slug);
              return label ? <Tag key={slug} tone="outline" label={`${SPEAKS} ${label}`} /> : null;
            })}
          </View>
          <Txt variant="caption" className="mt-2">
            {t('s.person.memberSince', { date: formatDate(memberSince(person.id), { month: 'long', year: 'numeric' }) })}
          </Txt>
          <View className="flex-row gap-2 mt-4">
            {isFriend ? (
              <SecondaryButton label={t('s.person.message')} icon="chat" tone="ink" onPress={() => { const thread = openThread('solo', person.name, person.name); router.push(`/messages/${thread.id}` as never); }} />
            ) : (
              <SecondaryButton label={requested ? t('s.person.requested') : t('s.person.addFriend')} icon={requested ? 'success' : 'plus'} tone="ink" disabled={requested} onPress={sendRequest} />
            )}
          </View>
        </View>

        <View className="px-5">
          <Section>
            <SectionHead title={t('s.person.common.title')} subtitle={common.length ? t('s.person.common.subtitle', { count: common.length }) : t('s.person.common.none')} />
            {common.length ? (
              <RowList>
                {common.map((want) => (
                  // Both of you want it, so the ask is one tap from here.
                  <View key={want.id} className="flex-row items-center">
                    <View className="flex-1 min-w-0">
                      <SomedayRow want={want} line={t('s.person.common.line')} chevron={false} onPress={() => router.push(`/want/${want.id}` as never)} />
                    </View>
                    <View className="ml-2">
                      <PillButton
                        label={t('s.want.ask')}
                        accessibilityLabel={t('s.want.askPerson', { name: first })}
                        onPress={() => {
                          const thread = askPerson(person.name, want.id, wantTitle(want), want.party === 'group' ? 'group' : 'duo');
                          toast(t('s.toasts.asked', { name: first }));
                          router.push(`/messages/${thread.id}` as never);
                        }}
                      />
                    </View>
                  </View>
                ))}
              </RowList>
            ) : null}
          </Section>

          <Section>
            <SectionHead title={t('s.person.theirs.title')} subtitle={t('s.person.theirs.subtitle')} />
            {/* Their list is the server's answer, not a guess: while it is in
                flight say so rather than showing an empty section that reads
                as "they want nothing". */}
            {personLoading ? <Txt variant="caption">{t('s.person.theirs.loading')}</Txt> : null}
            <RowList>
              {rest.map((want) => {
                const kept = keptIds.includes(want.id);
                return (
                  <NavRow
                    key={want.id}
                    accessibilityLabel={wantTitle(want)}
                    leading={
                      <View className="w-14 h-14 rounded-[4px] overflow-hidden bg-brand-paper-sunk">
                        <BrandedImage source={want.photo} fallback={CATALOG_FALLBACK} style={StyleSheet.absoluteFill} contentFit="cover" />
                      </View>
                    }
                    title={wantTitle(want)}
                    caption={want.party === 'group' ? t('s.common.group') : want.party === 'duo' ? t('s.common.duo') : t('s.common.anyWay')}
                    chevron={false}
                    onPress={() => router.push(`/want/${want.id}` as never)}
                    trailing={
                      <IconButton
                        icon={kept ? 'success' : 'heart'}
                        label={kept ? t('s.person.kept') : t('s.person.keep', { title: wantTitle(want) })}
                        onPress={() => {
                          if (kept) { unkeep(want.id); return; }
                          keep(want.id);
                          toast(t('s.toasts.kept', { title: wantTitle(want) }), { action: { label: t('s.common.undo'), onClick: () => unkeep(want.id) } });
                        }}
                      />
                    }
                  />
                );
              })}
            </RowList>
          </Section>

          <View className="flex-row justify-center">
            <GhostButton label={t('s.person.hide', { name: first })} tone="muted" onPress={hide} />
            <GhostButton label={t('s.person.report')} tone="muted" onPress={() => setReporting(true)} />
          </View>
        </View>
      </ScrollView>

      <ReportSheet name={person.name} visible={reporting} onDismiss={() => setReporting(false)} onHide={() => { setReporting(false); hide(); }} onSend={(reason) => reportPerson(person.name, reason)} />
      {common.length ? (
        <StickyFooter>
          <PrimaryButton label={t('s.person.planTogether')} icon="arrow-right" onPress={() => router.push(`/lock/${common[0].id}?with=${encodeURIComponent(person.name)}` as never)} />
        </StickyFooter>
      ) : null}
    </View>
  );
}
