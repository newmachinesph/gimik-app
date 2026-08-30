import { View } from 'react-native';

import { FocusablePressable } from './pressable';
import { Txt } from './txt';

/**
 * Every section in the reference pairs a bold title with a muted descriptor line.
 * That pairing is the layout's whole rhythm, so it is one component — otherwise it
 * drifts screen to screen and the page stops feeling designed.
 */
export function SectionHead({
  title,
  subtitle,
  action,
  onAction,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <View className={`flex-row items-start justify-between mb-4 ${className}`}>
      <View className="flex-1 pr-3">
        <Txt variant="heading" headingLevel={2}>{title}</Txt>
        {subtitle ? (
          <Txt variant="caption" className="mt-[3px]">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {action ? (
        <FocusablePressable
          accessibilityRole="button"
          onPress={onAction}
          className="min-h-11 px-2 -mr-2 justify-center active:opacity-60"
        >
          <Txt variant="label" className="text-brand-orange-deep">
            {action}
          </Txt>
        </FocusablePressable>
      ) : null}
    </View>
  );
}
