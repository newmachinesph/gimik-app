import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import {
  EmptyState,
  FocusablePressable,
  NavRow,
  RowList,
  Screen,
  Section,
  SectionHead,
  TopBar,
  Txt,
} from '@/components/ui';
import { acceptRequest as accept, declineRequest as decline } from '@/lib/actions';
import { genderMark, PERSON_BY_NAME } from '@/lib/people';
import { useApp } from '@/store';

/** Requests first, then friends. Nobody is a friend until both said so. */
export default function Friends() {
  const { t } = useTranslation();
  const requests = useApp((s) => s.requests);
  const friends = useApp((s) => s.friends);

  const personRow = (name: string, trailing?: React.ReactNode) => {
    const person = PERSON_BY_NAME.get(name);
    return (
      <NavRow
        key={name}
        avatar={name}
        size="lg"
        title={`${name}${person ? ` ${genderMark(person.gender)}` : ''}`}
        caption={person?.city}
        trailing={trailing}
        onPress={() => router.push(`/person/${encodeURIComponent(name)}` as never)}
      />
    );
  };

  return (
    <Screen inset={false}>
      <TopBar title={t('s.friends.title')} />
      {requests.length ? (
        <Section>
          <SectionHead title={t('s.friends.requests.title')} subtitle={t('s.friends.requests.subtitle', { count: requests.length })} />
          <RowList>
            {requests.map((request) =>
              personRow(request.from, (
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <FocusablePressable accessibilityRole="button" onPress={() => { decline(request.from); toast(t('s.toasts.requestDeclined')); }} className="px-2 py-2 active:opacity-60">
                    <Txt variant="label">{t('s.friends.notNow')}</Txt>
                  </FocusablePressable>
                  <FocusablePressable accessibilityRole="button" onPress={() => { accept(request.from); toast(t('s.toasts.requestAccepted', { name: request.from.split(' ')[0] })); }} className="px-2 py-2 active:opacity-60">
                    <Txt variant="label" className="text-brand-primary" style={{ fontFamily: 'Geist_600SemiBold' }}>{t('s.friends.accept')}</Txt>
                  </FocusablePressable>
                </View>
              )),
            )}
          </RowList>
        </Section>
      ) : null}
      <Section>
        <SectionHead title={t('s.friends.title')} subtitle={`${friends.length}`} />
        {friends.length ? (
          <RowList>{friends.map((name) => personRow(name))}</RowList>
        ) : (
          <EmptyState icon="people" title={t('s.friends.empty.title')} body={t('s.friends.empty.body')} />
        )}
      </Section>
    </Screen>
  );
}
