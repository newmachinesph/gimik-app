import { StyleSheet, View } from 'react-native';

import { Badge, BrandedImage, Card, FocusablePressable, GimikIcon, ScrollingTitle } from '@/components/ui';
import { C } from '@/lib/tokens';
import { CATALOG_FALLBACK } from '@/lib/storage';
import { categoryLabel, wantTitle, type Want } from '@/lib/mock';

/**
 * A catalog tile: image, small category tag, a two-line title that scrolls.
 *
 * The title box is always two lines tall, even for a title that needs one. In a
 * two-column grid the alternative is a ragged bottom edge - every short title
 * pulling its card up out of line with its neighbour - and that reads as
 * breakage rather than as economy. A title needing three lines or more scrolls
 * through the rest a line at a time instead of ending in an ellipsis.
 */
export function SomedayTile({
  want,
  onPress,
  selected,
}: {
  want: Want;
  onPress: () => void;
  /** Set only where tiles are picked; the check and ring then mark the chosen ones. */
  selected?: boolean;
}) {
  const pickable = selected !== undefined;
  return (
    <FocusablePressable
      accessibilityRole={pickable ? 'checkbox' : 'button'}
      accessibilityState={pickable ? { checked: selected } : undefined}
      accessibilityLabel={wantTitle(want)}
      onPress={onPress}
      className="active:opacity-90"
    >
      {/* The ring is always there on a pickable tile, transparent until chosen, so picking never shifts the grid. */}
      <Card className={`overflow-hidden ${pickable ? `border-2 ${selected ? 'border-brand-primary' : 'border-transparent'}` : ''}`}>
        <View className="h-[126px]">
          <BrandedImage source={want.photo} fallback={CATALOG_FALLBACK} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
          <View className="absolute left-2 top-2">
            <Badge label={categoryLabel(want.category)} tone="glass" size="sm" />
          </View>
          {selected ? (
            <View className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-brand-primary">
              <GimikIcon name="success" size={16} color={C.primaryInk} weight="bold" />
            </View>
          ) : null}
        </View>
        <View className="px-3 py-3">
          <ScrollingTitle variant="label" className="text-brand-ink" lines={2} lineHeight={18} reserve>
            {wantTitle(want)}
          </ScrollingTitle>
        </View>
      </Card>
    </FocusablePressable>
  );
}