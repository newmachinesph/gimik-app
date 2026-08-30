import { View } from 'react-native';

import { Avatar, FocusablePressable, Txt } from '@/components/ui';

const TILE = 72;

/**
 * A wrap of faces with first names under them.
 *
 * Read-only it is the cast of a plan; with `selected` it is the picker on the
 * lock screen. One component, because "who is in this" should look identical
 * whether you are choosing them or being shown them.
 */
export function PeopleGrid({
  names,
  selected,
  onToggle,
}: {
  names: string[];
  /** Omit for a read-only grid. */
  selected?: string[];
  onToggle?: (name: string) => void;
}) {
  const picking = Boolean(selected && onToggle);

  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      {names.map((name) => {
        const on = selected?.includes(name) ?? true;
        const face = (
          <>
            <Avatar name={name} size={56} />
            <Txt variant="caption" className="mt-1" numberOfLines={1}>{name.split(' ')[0]}</Txt>
          </>
        );
        if (!picking) {
          return <View key={name} className="items-center" style={{ width: TILE }}>{face}</View>;
        }
        return (
          <FocusablePressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={name}
            accessibilityState={{ selected: on }}
            onPress={() => onToggle?.(name)}
            style={{ width: TILE }}
            className={`items-center active:opacity-75 ${on ? '' : 'opacity-50'}`}
          >
            {face}
          </FocusablePressable>
        );
      })}
    </View>
  );
}
