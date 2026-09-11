import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Avatar,
  BottomSheet,
  FocusablePressable,
  GhostButton,
  GimikIcon,
  PrimaryButton,
  SecondaryButton,
  Txt,
} from '@/components/ui';
import { wantTitle, type Want } from '@/lib/mock';
import { genderMark, type Person } from '@/lib/people';
import { C } from '@/lib/tokens';
import type { Party } from '@/store';

/**
 * An invite, up close. The someday, who is asking, in what shape - then one
 * yes and two quiet noes. Nobody is told which one you picked.
 */
export function InviteSheet({ row, onAccept, onNotNow, onHide, onDismiss }: {
  row: { want: Want; person: Person; party: Party } | null;
  onAccept: () => void;
  onNotNow: () => void;
  onHide: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const first = row?.person.name.split(' ')[0] ?? '';
  return (
    <BottomSheet visible={Boolean(row)} onDismiss={onDismiss}>
      {row ? (
        <View>
          <Txt variant="eyebrow">{row.party === 'duo' ? t('s.inviteSheet.duo') : t('s.inviteSheet.group')}</Txt>
          <Txt variant="title" className="mt-1" numberOfLines={2}>{wantTitle(row.want)}</Txt>
          <FocusablePressable accessibilityRole="button" accessibilityLabel={t('s.messages.view', { name: row.person.name })} onPress={() => { onDismiss(); router.push(`/person/${encodeURIComponent(row.person.name)}` as never); }} className="flex-row items-center mt-5 py-3 px-3 rounded-[4px] bg-brand-paper-sunk active:opacity-70">
            <Avatar name={row.person.name} size={44} />
            <View className="flex-1 ml-3">
              <Txt variant="label" className="text-brand-ink">{row.person.name} {genderMark(row.person.gender)}{row.person.age ? `, ${row.person.age}` : ''}</Txt>
              <Txt variant="caption" numberOfLines={1}>{row.person.city}{row.person.bio ? ` · ${row.person.bio}` : ''}</Txt>
            </View>
            <GimikIcon name="chevron-right" size={16} color={C.inkMuted} />
          </FocusablePressable>
          <Txt variant="body" className="mt-4">{row.party === 'group' ? t('s.inviteSheet.bodyGroup', { name: first }) : t('s.inviteSheet.body', { name: first })}</Txt>
          <View className="mt-5"><PrimaryButton label={t('s.inviteSheet.accept')} icon="arrow-right" onPress={onAccept} /></View>
          <View className="mt-2"><SecondaryButton label={t('s.inviteSheet.notNow')} tone="ink" onPress={onNotNow} /></View>
          <View className="mt-1"><GhostButton label={t('s.inviteSheet.hide', { name: first })} tone="muted" onPress={onHide} /></View>
        </View>
      ) : null}
    </BottomSheet>
  );
}
