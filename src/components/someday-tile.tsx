import { StyleSheet, View } from 'react-native';

import { Badge, BrandedImage, Card, FocusablePressable, ScrollingTitle } from '@/components/ui';
import { CATALOG_FALLBACK } from '@/lib/storage';
import { categoryLabel, wantTitle, type Want } from '@/lib/mock';

/** A catalog tile: image, small category tag, a two-line title that scrolls. */
export function SomedayTile({ want, onPress }: { want: Want; onPress: () => void }) {
  return (
    <FocusablePressable accessibilityRole="button" accessibilityLabel={wantTitle(want)} onPress={onPress} className="active:opacity-90">
      <Card className="overflow-hidden">
        <View className="h-[126px]">
          <BrandedImage source={want.photo} fallback={CATALOG_FALLBACK} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
          <View className="absolute left-2 top-2">
            <Badge label={categoryLabel(want.category)} tone="glass" size="sm" />
          </View>
        </View>
        <View className="px-3 py-3">
          <ScrollingTitle variant="label" className="text-brand-ink" lines={2} lineHeight={18}>
            {wantTitle(want)}
          </ScrollingTitle>
        </View>
      </Card>
    </FocusablePressable>
  );
}