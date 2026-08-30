import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, PrimaryButton, Txt } from '@/components/ui';
import { wantTitle, type Want } from '@/lib/mock';
import { C } from '@/lib/tokens';
import type { Audience, Party, Visibility } from '@/store';

const AUDIENCES: Audience[] = ['friends', 'groups', 'everyone'];
const PARTIES: Party[] = ['duo', 'group'];

/**
 * The one question a keep asks: who may see this, and in what shape. Two rows
 * of chips, a remember toggle, one button. Asked once unless remembered.
 */
export function KeepPrompt({ want, initial, onDone, onDismiss }: {
  want: Want | null;
  initial: Visibility;
  onDone: (visibility: Visibility, remember: boolean) => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [openTo, setOpenTo] = useState<Audience[]>(initial.openTo);
  const [as, setAs] = useState<Party[]>(initial.as);
  const [remember, setRemember] = useState(false);
  useEffect(() => {
    if (want) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resync the draft when a new card opens
      setOpenTo(initial.openTo);
      setAs(initial.as);
    }
  }, [initial, want]);

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);

  // No sheet, no modal: a mounted-but-hidden Modal keeps a native surface
  // open on the deck, which is where Fabric was losing the tree.
  if (!want) return null;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable accessibilityLabel={t('s.common.close')} onPress={onDismiss} style={{ flex: 1, backgroundColor: `${C.night}99` }} />
      <View className="bg-brand-paper rounded-t-[4px] px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="self-center w-10 h-1 rounded-full bg-brand-rule mb-5" />
        <Txt variant="eyebrow">{t('s.keepPrompt.kept')}</Txt>
        <Txt variant="title" className="mt-1" numberOfLines={2}>{want ? wantTitle(want) : ''}</Txt>

        <Txt variant="label" className="text-brand-ink mt-5 mb-2">{t('s.visibility.openTo')}</Txt>
        <View className="flex-row flex-wrap gap-2">
          {AUDIENCES.map((value) => (
            <Chip key={value} label={t(`s.visibility.${value}`)} selected={openTo.includes(value)} onPress={() => setOpenTo((current) => toggle(current, value))} />
          ))}
        </View>
        <Txt variant="caption" className="mt-2">
          {openTo.length ? openTo.map((value) => t(`s.keepPrompt.hints.${value}`)).join(' · ') : t('s.keepPrompt.hints.justMe')}
        </Txt>

        <Txt variant="label" className="text-brand-ink mt-4 mb-2">{t('s.visibility.as')}</Txt>
        <View className="flex-row gap-2">
          {PARTIES.map((value) => (
            <Chip key={value} label={t(`s.common.${value}`)} selected={as.includes(value)} onPress={() => setAs((current) => toggle(current, value))} />
          ))}
        </View>

        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: remember }} onPress={() => setRemember((value) => !value)} className="flex-row items-center mt-5 active:opacity-70">
          <View className={`w-5 h-5 rounded-[4px] border mr-3 items-center justify-center ${remember ? 'bg-brand-night border-brand-night' : 'border-brand-rule'}`}>
            {remember ? <View className="w-2 h-2 rounded-[1px] bg-brand-paper" /> : null}
          </View>
          <Txt variant="label">{t('s.keepPrompt.remember')}</Txt>
        </Pressable>

        <View className="mt-5">
          <PrimaryButton label={t('s.common.done')} onPress={() => onDone({ openTo, as }, remember)} />
        </View>
      </View>
    </Modal>
  );
}
