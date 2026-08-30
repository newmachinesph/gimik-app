import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SomedayRow } from '@/components/someday-row';
import {
  Avatar,
  EmptyState,
  FocusablePressable,
  GoraIcon,
  IconButton,
  NavRow,
  ProgressRing,
  RowList,
  Screen,
  Section,
  SectionHead,
  Tag,
  Txt,
} from '@/components/ui';
import { useProfileCompleteness } from '@/lib/completeness';
import { ageFrom, timestampDayLabel } from '@/lib/format';
import { interestBadge } from '@/lib/interests';
import { genderMark } from '@/lib/people';
import { languageLabel } from '@/lib/profile-options';
import { useMine } from '@/lib/somedays';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

const SPEAKS = '\u{1F5E3}';

/** Who am I to them? Photo, name, city, bio; friends and groups; the record. */
export default function Profile() {
  const { t } = useTranslation();
  const profile = useApp((state) => state.profile);
  const friends = useApp((state) => state.friends);
  const requests = useApp((state) => state.requests);
  const groups = useApp((state) => state.groups);
  const doneAt = useApp((state) => state.doneAt);
  const { done } = useMine();
  const age = ageFrom(profile.birthday);
  const { fraction: completeness, next } = useProfileCompleteness();
  const name = profile.name || t('core.common.goraMember');
  const interests = profile.interests ?? [];
  const languages = profile.languages ?? [];

  return (
    <Screen>
      <View className="flex-row justify-end pt-2">
        <IconButton icon="settings" label={t('s.common.settings')} onPress={() => router.push('/settings' as never)} />
      </View>

      <View className="items-center pb-6">
        <FocusablePressable accessibilityRole="button" accessibilityLabel={t('s.profile.edit')} onPress={() => router.push('/edit-profile' as never)} className="active:opacity-80">
          <ProgressRing value={completeness} size={108}>
            <Avatar name={name} size={92} source={profile.photos[0]} />
          </ProgressRing>
        </FocusablePressable>
        <Txt variant="title" headingLevel={1} className="mt-3">
          {name}{age ? `, ${age}` : ''}{profile.gender ? ` ${genderMark(profile.gender)}` : ''}
        </Txt>
        {profile.handle ? <Txt variant="caption" className="mt-[2px]">@{profile.handle}</Txt> : null}
        <FocusablePressable accessibilityRole="button" onPress={() => router.push('/city' as never)} className="flex-row items-center mt-1 active:opacity-70">
          <GoraIcon name="map-pin" size={13} color={profile.city ? C.ink : C.inkMuted} weight={profile.city ? 'fill' : 'regular'} />
          <Txt variant="label" className={`ml-1 ${profile.city ? 'text-brand-ink' : ''}`}>
            {profile.city ?? t('s.profile.addCity')}{profile.hometown ? ` \u00B7 ${t('s.profile.from', { name: profile.hometown })}` : ''}
          </Txt>
        </FocusablePressable>
        {profile.bio ? <Txt variant="body" className="mt-2 text-center max-w-[300px]">{profile.bio}</Txt> : null}
        {profile.work || profile.education ? (
          <View className="mt-2 items-center" style={{ gap: 4 }}>
            {profile.work ? (
              <View className="flex-row items-center">
                <GoraIcon name="work" size={14} color={C.inkMuted} />
                <Txt variant="label" className="ml-2" numberOfLines={1}>{profile.work}</Txt>
              </View>
            ) : null}
            {profile.education ? (
              <View className="flex-row items-center">
                <GoraIcon name="education" size={14} color={C.inkMuted} />
                <Txt variant="label" className="ml-2" numberOfLines={1}>{profile.education}</Txt>
              </View>
            ) : null}
          </View>
        ) : null}
        {interests.length || languages.length ? (
          <View className="flex-row flex-wrap justify-center mt-3" style={{ gap: 6, maxWidth: 330 }}>
            {interests.map((slug) => {
              const badge = interestBadge(slug);
              return badge ? <Tag key={slug} label={badge} /> : null;
            })}
            {languages.map((slug) => {
              const label = languageLabel(slug);
              return label ? <Tag key={slug} tone="outline" label={`${SPEAKS} ${label}`} /> : null;
            })}
          </View>
        ) : null}
        {next ? (
          <FocusablePressable accessibilityRole="button" onPress={() => router.push(next.href as never)} className="mt-4 flex-row items-center justify-center rounded-full bg-brand-primary px-5 py-2 active:opacity-85">
            <Txt variant="label" className="text-brand-paper" style={{ fontFamily: 'Geist_600SemiBold' }}>{t('s.profile.completeChip')}</Txt>
            <Txt variant="label" className="text-brand-paper/80 ml-2">{Math.round(completeness * 100)}%</Txt>
          </FocusablePressable>
        ) : (
          <View className="mt-4 flex-row items-center rounded-full bg-brand-paper-sunk border border-brand-rule px-4 py-2">
            <GoraIcon name="success" size={14} color={C.success} weight="fill" />
            <Txt variant="caption" className="text-brand-ink ml-1">{t('s.profile.complete')}</Txt>
          </View>
        )}
      </View>

      <RowList className="mb-6">
        <NavRow
          icon="people"
          title={t('s.profile.friends')}
          badge={requests.length}
          count={friends.length}
          size="lg"
          onPress={() => router.push('/friends' as never)}
        />
        <NavRow
          icon="stack"
          title={t('s.profile.groups')}
          count={groups.length}
          size="lg"
          onPress={() => router.push('/groups' as never)}
        />
      </RowList>

      <Section>
        <SectionHead title={t('s.profile.record.title')} subtitle={done.length ? t('s.profile.record.done', { count: done.length }) : t('s.profile.record.emptySubtitle')} />
        {done.length ? (
          <RowList>
            {done.map((want) => (
              <SomedayRow
                key={want.id}
                want={want}
                line={doneAt[want.id] ? timestampDayLabel(doneAt[want.id]) : t('s.activity.doneLine')}
                onPress={() => router.push(`/journal/${want.id}` as never)}
              />
            ))}
          </RowList>
        ) : (
          <EmptyState icon="success" title={t('s.profile.record.emptyTitle')} body={t('s.profile.record.emptyBody')} />
        )}
      </Section>
    </Screen>
  );
}
