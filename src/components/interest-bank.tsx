import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { INTEREST_GROUPS, MAX_INTERESTS } from '@/lib/interests';

/**
 * Bumble's interest shelves, PH edition: thirteen groups of emoji-and-name
 * chips, at most ten worn at once. The counter is the only enforcement - at
 * the cap, unpicked chips simply stop responding, quietly.
 */
export function InterestBank({ selected, onChange }: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  const atCap = selected.length >= MAX_INTERESTS;

  const toggle = (slug: string) => {
    if (selected.includes(slug)) onChange(selected.filter((item) => item !== slug));
    else if (!atCap) onChange([...selected, slug]);
  };

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-1">
        <Txt variant="label" className="text-brand-ink">{t('s.interests.pickUpTo', { max: MAX_INTERESTS })}</Txt>
        <Txt variant="caption" className={atCap ? 'text-brand-primary' : ''}>{selected.length}/{MAX_INTERESTS}</Txt>
      </View>
      {INTEREST_GROUPS.map((group) => (
        <View key={group.slug} className="mt-4">
          <Txt variant="eyebrow" className="mb-2">{group.emoji}  {group.label}</Txt>
          <View className="flex-row flex-wrap gap-2">
            {group.items.map((item) => {
              const picked = selected.includes(item.slug);
              return (
                <View key={item.slug} style={!picked && atCap ? { opacity: 0.4 } : null}>
                  <Chip label={`${item.emoji} ${item.label}`} selected={picked} onPress={() => toggle(item.slug)} />
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
