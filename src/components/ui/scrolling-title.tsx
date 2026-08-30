import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type TextLayoutEvent } from 'react-native';

import { Txt, type TxtProps } from './txt';

const READ_PAUSE_MS = 1800;
const LINE_SCROLL_MS = 650;
const RETURN_MS = 450;

/**
 * A title held to a fixed number of lines that shows the rest by scrolling.
 *
 * Every card in a row gets the same height whether its title is one line or
 * four, and a long one is still readable: after a pause the text drifts up a
 * line at a time, waits, and returns. Ellipsis alone threw away the end of the
 * title — the part that says which river, which border — which is the part a
 * person is choosing on.
 *
 * With reduce-motion on it stays put and ellipsises, which is the honest
 * fallback rather than a silent one.
 */
export function ScrollingTitle({
  lines = 2,
  lineHeight,
  children,
  style,
  ...txtProps
}: TxtProps & {
  lines?: number;
  /** The variant's line box. Passed explicitly because the box has to be exact. */
  lineHeight: number;
  children: string;
}) {
  const [total, setTotal] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [offset] = useState(() => new Animated.Value(0));
  const overflow = Math.max(0, total - lines);

  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (live) setReduceMotion(enabled);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!overflow || reduceMotion) {
      offset.setValue(0);
      return;
    }
    // One line per step so the eye can follow, a pause at each end long enough
    // to read, then a quicker return to the start.
    const steps = Array.from({ length: overflow }, (_, index) => [
      Animated.timing(offset, {
        toValue: -(index + 1) * lineHeight,
        duration: LINE_SCROLL_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(READ_PAUSE_MS),
    ]).flat();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(READ_PAUSE_MS),
        ...steps,
        Animated.timing(offset, { toValue: 0, duration: RETURN_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lineHeight, offset, overflow, reduceMotion]);

  const onTextLayout = (event: TextLayoutEvent) => {
    const count = event.nativeEvent.lines.length;
    setTotal((current) => (current === count ? current : count));
  };

  // A one-line title takes one line: reserving the full box for every row left
  // a band of dead space between short titles and their captions. The fixed,
  // clipped box exists only when there is actually something to scroll. The
  // measuring copy is invisible and out of flow, so the visible text can stay
  // clamped without hiding the true line count from the animation.
  const measure = (
    <Txt
      {...txtProps}
      aria-hidden
      style={[{ lineHeight, position: 'absolute', opacity: 0, left: 0, right: 0 }, style]}
      onTextLayout={onTextLayout}
    >
      {children}
    </Txt>
  );

  if (!overflow || reduceMotion) {
    return (
      <View>
        {measure}
        <Txt {...txtProps} style={[{ lineHeight }, style]} numberOfLines={lines} ellipsizeMode="tail">
          {children}
        </Txt>
      </View>
    );
  }

  return (
    <View style={{ height: lines * lineHeight, overflow: 'hidden' }}>
      {measure}
      <Animated.View style={{ transform: [{ translateY: offset }] }}>
        <Txt {...txtProps} style={[{ lineHeight }, style]} ellipsizeMode="tail">
          {children}
        </Txt>
      </Animated.View>
    </View>
  );
}
