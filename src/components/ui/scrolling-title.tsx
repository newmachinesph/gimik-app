import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type TextLayoutEvent } from 'react-native';

import { Txt, type TxtProps } from './txt';

const READ_PAUSE_MS = 1800;
const LINE_SCROLL_MS = 650;
const RETURN_MS = 450;

/**
 * A title held to a fixed number of lines that shows the rest by scrolling.
 *
 * A long title stays readable: after a pause the text drifts up a line at a
 * time, waits, and returns. Ellipsis alone threw away the end of the title -
 * the part that says which river, which border - which is the part a person is
 * choosing on.
 *
 * By default the box is only as tall as the title needs, because in a vertical
 * list a short title followed by its caption should not carry a band of dead
 * space. `reserve` asks for the opposite: always the full `lines * lineHeight`
 * box, however short the text. That is what a grid wants, where cards sit side
 * by side and a one-line title beside a two-line one leaves a ragged bottom
 * edge down the whole screen.
 *
 * With reduce-motion on it stays put and ellipsises, which is the honest
 * fallback rather than a silent one.
 */
export function ScrollingTitle({
  lines = 2,
  lineHeight,
  reserve = false,
  children,
  style,
  ...txtProps
}: TxtProps & {
  lines?: number;
  /** The variant's line box. Passed explicitly because the box has to be exact. */
  lineHeight: number;
  /** Hold the full height even when the title is shorter. For grids. */
  reserve?: boolean;
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

  // Unless `reserve` is asked for, a one-line title takes one line: holding the
  // full box in every row left a band of dead space between short titles and
  // their captions. The measuring copy is invisible and out of flow, so the
  // visible text can stay clamped without hiding the true line count from the
  // animation.
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
      // Reserved or not, the text starts at the top of the box, so a one-line
      // title sits on the same baseline as the first line of a two-line one.
      <View style={reserve ? { height: lines * lineHeight, overflow: 'hidden' } : undefined}>
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
      {/* Absolute, so the text is laid out at its own height rather than the
          box's. As a normal child it inherits the clipped height and Yoga lays
          out only the lines that fit - so scrolling up revealed blank space
          where the rest of the title should have been, which defeated the whole
          point of scrolling. Out of flow it wraps to its full length and the
          parent does the clipping, visually, as intended. */}
      <Animated.View
        style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: [{ translateY: offset }] }}
      >
        <Txt {...txtProps} style={[{ lineHeight }, style]}>
          {children}
        </Txt>
      </Animated.View>
    </View>
  );
}
