import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar, FocusablePressable, GoraIcon, ScrollingTitle, Txt } from '@/components/ui';
import { wantTitle, type Want } from '@/lib/mock';
import { genderMark, type Person } from '@/lib/people';
import { C } from '@/lib/tokens';
import type { Party } from '@/store';

/**
 * The someday first, because that is what you said yes to; then who, in one
 * plain caption. Avatar opens the person, the row opens the invite.
 */
export function InviteRow({ want, person, party, note, onPress }: {
  want: Want;
  person: Person;
  party: Party;
  /** Said only when the invite is nearly out of time. */
  note?: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <FocusablePressable accessibilityRole="button" onPress={onPress} className="flex-row items-center py-3 active:opacity-70">
      <FocusablePressable accessibilityRole="button" accessibilityLabel={person.name} onPress={() => router.push(`/person/${encodeURIComponent(person.name)}` as never)}>
        <Avatar name={person.name} size={44} />
      </FocusablePressable>
      <View className="flex-1 ml-3 min-w-0">
        <ScrollingTitle variant="label" className="text-brand-ink" lines={2} lineHeight={18}>
          {wantTitle(want)}
        </ScrollingTitle>
        <Txt variant="caption" numberOfLines={1} className="mt-1">
          {person.name} {genderMark(person.gender)} {'\u00B7'} {party === 'duo' ? t('s.common.duo') : t('s.common.group')} {'\u00B7'} {person.city}
        </Txt>
        {note ? <Txt variant="caption" className="mt-1 text-brand-orange">{note}</Txt> : null}
      </View>
      <GoraIcon name="chevron-right" size={16} color={C.inkMuted} />
    </FocusablePressable>
  );
}
