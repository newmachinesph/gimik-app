import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import type { Audience, Party, Visibility } from '@/store';

const AUDIENCES: Audience[] = ['friends', 'groups', 'everyone'];
const PARTIES: Party[] = ['duo', 'group'];

/** The two visibility axes as chip rows. Empty "open to" reads as Just me. */
export function VisibilityChips({ value, onChange }: { value: Visibility; onChange: (next: Visibility) => void }) {
  const { t } = useTranslation();
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  return (
    <View>
      <Txt variant="eyebrow" className="mb-2">{t('s.visibility.openTo')}</Txt>
      <View className="flex-row flex-wrap gap-2">
        <Chip label={t('s.visibility.justMe')} selected={value.openTo.length === 0} onPress={() => onChange({ ...value, openTo: [] })} />
        {AUDIENCES.map((item) => (
          <Chip key={item} label={t(`s.visibility.${item}`)} selected={value.openTo.includes(item)} onPress={() => onChange({ ...value, openTo: toggle(value.openTo, item) })} />
        ))}
      </View>
      <Txt variant="eyebrow" className="mt-4 mb-2">{t('s.visibility.as')}</Txt>
      <View className="flex-row gap-2">
        {PARTIES.map((item) => (
          <Chip key={item} label={t(`s.common.${item}`)} selected={value.as.includes(item)} onPress={() => onChange({ ...value, as: toggle(value.as, item) })} />
        ))}
      </View>
    </View>
  );
}
