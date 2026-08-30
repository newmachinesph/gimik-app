/* Hallmark · component: card + state badge · genre: playful-editorial · theme: studied-DNA
 * separation: surface contrast + 1px rule · shadows: none
 */

import { View, type ViewProps } from 'react-native';

import { C, RADIUS } from '@/lib/tokens';
import { Txt } from './txt';

export type CardTone = 'paper' | 'sunk' | 'night' | 'white' | 'surface' | 'ink';

export function Card({
  className = '',
  tone = 'paper',
  ...rest
}: ViewProps & { className?: string; tone?: CardTone }) {
  const resolved = tone === 'white' ? 'paper' : tone === 'surface' ? 'sunk' : tone === 'ink' ? 'night' : tone;
  const skin =
    resolved === 'night'
      ? 'bg-brand-night border-brand-rule-invert'
      : resolved === 'sunk'
        ? 'bg-brand-paper-sunk border-brand-rule'
        : 'bg-brand-paper border-brand-rule';
  return <View className={`${skin} rounded-[4px] border ${className}`} {...rest} />;
}

/** Small utility badge. Orange and sky fills always take ink, never white. */
export function Badge({
  label,
  tone = 'light',
  size = 'md',
}: {
  label: string;
  tone?: 'light' | 'dark' | 'orange' | 'sky' | 'glass';
  /** `sm` is the tag on a photo tile: a category, not a status. */
  size?: 'sm' | 'md';
}) {
  const small = size === 'sm';
  const resolved = tone === 'glass' ? 'dark' : tone;
  const skin =
    resolved === 'dark'
      ? { backgroundColor: C.night, borderColor: C.ruleInvert, color: C.paper }
      : resolved === 'orange'
        ? { backgroundColor: C.orange, borderColor: C.orange, color: C.paper }
        : resolved === 'sky'
          ? { backgroundColor: C.sky, borderColor: C.sky, color: C.ink }
          : { backgroundColor: C.paperSunk, borderColor: C.rule, color: C.ink };

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: skin.backgroundColor,
        borderColor: skin.borderColor,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        maxWidth: '100%',
        paddingHorizontal: small ? 7 : 12,
        paddingVertical: small ? 3 : 6,
      }}
    >
      <Txt
        variant="eyebrow"
        numberOfLines={1}
        ellipsizeMode="tail"
        // Inline, because a className size would lose to the variant's on source order.
        style={[{ color: skin.color, flexShrink: 1 }, small ? { fontSize: 9, lineHeight: 12, letterSpacing: 0.8 } : null]}
      >
        {label}
      </Txt>
    </View>
  );
}

/** Hairline divider matching the warm ink rule. */
export function Divider({ className = '' }: { className?: string }) {
  return <View className={`h-px bg-brand-rule ${className}`} />;
}
