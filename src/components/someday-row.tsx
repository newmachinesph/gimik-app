import { StyleSheet, View } from 'react-native';

import { BrandedImage, FocusablePressable, GoraIcon, Txt } from '@/components/ui';
import { wantTitle, type Want } from '@/lib/mock';
import { CATALOG_FALLBACK } from '@/lib/storage';
import { C } from '@/lib/tokens';

/** A list row for a someday: thumbnail, title, one line of state. */
export function SomedayRow({ want, line, accent = false, chevron = true, onPress }: { want: Want; line: string; accent?: boolean; /** Off when something else in the row is the affordance. */ chevron?: boolean; onPress: () => void }) {
  return (
    <FocusablePressable accessibilityRole="button" accessibilityLabel={wantTitle(want)} onPress={onPress} className="flex-row items-center py-3 active:opacity-70">
      <View className="w-14 h-14 rounded-[4px] overflow-hidden bg-brand-paper-sunk">
        <BrandedImage source={want.photo} fallback={CATALOG_FALLBACK} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
      <View className="flex-1 ml-3 min-w-0">
        <Txt variant="label" className="text-brand-ink" numberOfLines={2}>{wantTitle(want)}</Txt>
        <Txt variant={accent ? 'date' : 'caption'} className="mt-1" numberOfLines={1}>{line}</Txt>
      </View>
      {chevron ? <GoraIcon name="chevron-right" size={16} color={C.inkMuted} /> : null}
    </FocusablePressable>
  );
}