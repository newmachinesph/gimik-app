import { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import './interop';
import { Txt } from './txt';

/** The screen gutter, in points — the numeric twin of the `px-5` utility.
 *  Full-bleed screens that pad their own sections read it directly. */
export const GUTTER = 20;

/** The floating dock's own height, shared so the bar and the screens that must
 *  clear it cannot drift apart. */
export const TAB_BAR_HEIGHT = 64;

// The floating tab bar is 64 tall, sits above the safe inset, and has a center
// action raised by 8px. This clears all of it without preserving the much larger
// space once needed by Home's permanent capture field.
export const TAB_BAR_CLEARANCE = 120;

/** Breathing room between the last scrolled item and a pinned footer. */
const FOOTER_GAP = 20;

/**
 * How far a pinned footer has to rise so the on-screen keyboard cannot bury it.
 *
 * iOS only, for the same reason `messages/[id]` only passes `behavior` there:
 * Android resizes the window for the keyboard, so an absolutely-positioned
 * footer already moves up and a manual lift would double-count. Web has no
 * on-screen keyboard that overlaps the layout viewport.
 */
function useKeyboardLift() {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', (event) =>
      setLift(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardWillHide', () => setLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return lift;
}

export function Screen({
  children,
  scroll = true,
  bg = 'surface',
  inset = true,
  padded = true,
  overlay,
  footer,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: 'surface' | 'white' | 'ink';
  /** Reserve bottom room for the floating tab bar. */
  inset?: boolean;
  /** Horizontal gutter. Turn off for full-bleed screens that pad their own sections. */
  padded?: boolean;
  /** Absolutely-positioned siblings of the scroll view — the OmniBar, ambient pills.
   *  They must live outside the ScrollView or they scroll away with the content. */
  overlay?: React.ReactNode;
  /** The terminal action for screens that ask for input first — "Build my list",
   *  "Save split", "Lock the best date". Pinned to the bottom of the viewport on
   *  its own surface, and the scroll content is padded by exactly its measured
   *  height so the last item is never trapped underneath it. */
  footer?: React.ReactNode;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboardLift = useKeyboardLift();
  const [footerHeight, setFooterHeight] = useState(0);
  const skin = bg === 'ink' ? 'bg-brand-night' : 'bg-brand-paper';
  const rule = bg === 'ink' ? 'border-brand-rule-invert' : 'border-brand-rule';
  const gutter = padded ? 'px-5' : '';

  // Web only. RNW gives every View flex-shrink:0 to match Yoga, so the framework
  // wrappers above this (expo-router's screen containers) carry flex-basis:auto and
  // never shrink below their content: they grow to fit the ScrollView, the
  // ScrollView grows to fit its content, and nothing is ever bounded.
  //
  // A height alone does not break the loop — flex-grow wins over height on the main
  // axis, so this View still stretched to the inflated parent. It has to stop
  // growing AND take an explicit viewport height, which then lets the wrappers
  // above collapse back down. Native keeps flex:1, where Yoga bounds it correctly.
  const isWeb = Platform.OS === 'web';
  const webBound = isWeb
    ? {
        alignSelf: 'center' as const,
        flexBasis: 'auto' as const,
        flexGrow: 0,
        flexShrink: 0,
        height: windowHeight,
        maxWidth: 760,
        width: '100%' as const,
      }
    : null;

  // Where a pinned footer's surface starts. Inside (tabs) it has to clear the
  // floating dock; everywhere else it bleeds to the screen edge and pads past the
  // home indicator itself. With the keyboard up it rides directly on top of it.
  const dockFloor = inset ? Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 12 : 0;
  const footerFloor = keyboardLift > 0 ? keyboardLift : dockFloor;
  const footerPadBottom = keyboardLift > 0 || inset ? 16 : Math.max(insets.bottom, 16);
  const contentPadding = footer
    ? footerHeight + dockFloor + FOOTER_GAP
    : inset
      ? TAB_BAR_CLEARANCE
      : 32;

  const measureFooter = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setFooterHeight((current) => (current === next ? current : next));
  };

  // SafeAreaView handles insets and nothing else — see the note in ./interop.
  // Background and gutter live on plain Views so neither can be flattened.
  return (
    <View style={webBound} className={isWeb ? skin : `flex-1 ${skin}`}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {scroll ? (
          <ScrollView
            // flex:1 is load-bearing. Without it the ScrollView sizes to its
            // content rather than to the viewport, so there is nothing to scroll —
            // the page just renders tall and clips. Dropping this silently broke
            // vertical scrolling on every screen that uses Screen.
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            // A tap on the pinned action while a field is focused should fire the
            // action, not merely dismiss the keyboard and be swallowed.
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{
              paddingBottom: contentPadding,
              // RNW applies the horizontal utility padding to a 100%-wide scroll
              // content node. Without border-box it adds 40px to the viewport and
              // clips cards and controls at narrow mobile widths.
              ...(isWeb ? { boxSizing: 'border-box', width: '100%' } : {}),
            }}
            contentContainerClassName={gutter}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            className={`flex-1 ${gutter}`}
            style={footer ? { paddingBottom: contentPadding } : undefined}
          >
            {children}
          </View>
        )}
      </SafeAreaView>
      {overlay}
      {footer ? (
        // No shadow — a hairline and an opaque surface do the separating.
        <View
          onLayout={measureFooter}
          className={`absolute left-0 right-0 border-t pt-4 ${skin} ${rule} ${gutter}`}
          style={{ bottom: footerFloor, paddingBottom: footerPadBottom }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="pt-3 pb-6 flex-row items-start justify-between">
      <View className="flex-1 pr-4">
        {eyebrow ? (
          <Txt variant="eyebrow" className="mb-2">
            {eyebrow}
          </Txt>
        ) : null}
        <Txt variant="title" headingLevel={1}>{title}</Txt>
        {subtitle ? (
          <Txt variant="body" className="mt-2">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Vertical rhythm between sections, so spacing lives here and not in every screen. */
export function Section({ className = '', ...rest }: ViewProps & { className?: string }) {
  return <View className={`mb-8 ${className}`} {...rest} />;
}

/**
 * A pinned bottom action bar for screens that cannot use `Screen`'s `footer` —
 * the full-bleed ones (`want/[id]`, `person/[name]`) that drive their own
 * ScrollView so a photo can run under the status bar.
 *
 * Same surface, same hairline, same safe-area maths as `Screen`'s footer, in
 * one place, so the two kinds of screen cannot drift apart.
 */
export function StickyFooter({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute left-0 right-0 bottom-0 px-5 pt-3 bg-brand-paper border-t border-brand-rule"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {children}
    </View>
  );
}
