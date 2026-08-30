import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { C } from '@/lib/tokens';

/**
 * A circular progress track that wraps whatever it is given — the profile
 * avatar, in practice. The child sits inside the ring's inner diameter, so a
 * `size` here is the outer edge and the child should be `size - 2 * stroke - gap`.
 *
 * Drawn with SVG rather than a rotated border trick: the arc has to start at
 * twelve o'clock and be exact at every fraction, and borders cannot do partial.
 */
export function ProgressRing({
  value,
  size,
  stroke = 4,
  gap = 3,
  children,
}: {
  /** 0–1. Clamped; the ring never overshoots or draws backwards. */
  value: number;
  size: number;
  stroke?: number;
  /** Breathing room between the ring and the child. */
  gap?: number;
  children?: React.ReactNode;
}) {
  const fraction = Math.min(1, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const inner = size - 2 * (stroke + gap);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0 }}
        // Rotate so the arc grows clockwise from the top, the way a clock fills.
        transform={[{ rotate: '-90deg' }]}
      >
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={C.rule} strokeWidth={stroke} fill="none" />
        {fraction > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={fraction >= 1 ? C.green : C.orange}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - fraction)}
            fill="none"
          />
        ) : null}
      </Svg>
      <View style={{ width: inner, height: inner, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
