import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandedImage, FocusablePressable, GoraIcon, ScrollingTitle, Txt } from '@/components/ui';
import { formatNumber } from '@/i18n/format';
import { matchedInterestLabel } from '@/lib/interests';
import { categoryLabel, wantLocationScope, wantTitle, type Want } from '@/lib/mock';
import { useApp } from '@/store';
import { holdersOf } from '@/lib/people';
import { CATALOG_FALLBACK } from '@/lib/storage';
import { C, tint } from '@/lib/tokens';

/**
 * The decide deck: one someday at a time, and a decision on each.
 *
 * Right keeps it on your list, left passes on it. The gesture and the two
 * buttons underneath do exactly the same thing, so nobody has to discover the
 * swipe to use the screen — the buttons teach it, the way Bumble's do.
 *
 * The deck owns only motion. Which cards are in it, and what "keep" and "pass"
 * mean, belong to the screen: the top card is always `wants[0]`, and the parent
 * removes it from the list after `onDecide` fires. That keeps undo simple — the
 * parent puts the card back at the front and the deck simply renders it.
 */

export type Decision = 'keep' | 'pass';

/** How far a card has to travel, as a fraction of the screen, before it counts. */
const DECIDE_FRACTION = 0.28;
const FLING_VELOCITY = 0.9;
const MAX_TILT_DEG = 14;
const EXIT_MS = 260;
const RETURN_TENSION = 60;
const REAR_SCALE = 0.94;
const REAR_OFFSET = 12;
const PREFETCH_AHEAD = 4;
const SCRIM = [tint(C.night, '00'), tint(C.night, '66'), tint(C.night, 'D9')] as const;

export function DecideDeck({
  wants,
  height,
  resurfacedIds,
  onDecide,
  onOpen,
}: {
  /** Remaining cards, front first. */
  wants: Want[];
  height: number;
  /** Kept somedays coming back to ask "still want this?" */
  resurfacedIds?: Set<string>;
  onDecide: (want: Want, decision: Decision) => void;
  onOpen: (want: Want) => void;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [position] = useState(() => new Animated.ValueXY());
  const front = wants[0];
  const behind = wants[1];
  // Refs so the gesture callbacks always name the card the gesture started on,
  // and the latest decide handler, without re-creating the responder per render.
  // They are written in an effect, never during render, so the compiler can
  // keep treating this component as pure.
  const frontRef = useRef(front);
  const decideRef = useRef(onDecide);
  const busyRef = useRef(false);
  useEffect(() => {
    frontRef.current = front;
    decideRef.current = onDecide;
  });

  const threshold = width * DECIDE_FRACTION;

  const settle = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      tension: RETURN_TENSION,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [position]);

  const fling = useCallback((decision: Decision) => {
    const card = frontRef.current;
    if (!card || busyRef.current) return;
    busyRef.current = true;
    const direction = decision === 'keep' ? 1 : -1;
    Animated.timing(position, {
      toValue: { x: direction * width * 1.3, y: 0 },
      duration: EXIT_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Reset before the parent removes the card, so the next front card is not
      // born off-screen and dragged back into place.
      position.setValue({ x: 0, y: 0 });
      busyRef.current = false;
      if (finished) decideRef.current(card, decision);
    });
  }, [position, width]);

  // The responder is created once. Its handlers read the latest fling/settle/
  // threshold through a ref that an effect keeps current, so the gesture never
  // has to be re-attached mid-drag and nothing here reads a ref during render.
  const handlersRef = useRef({ fling, settle, threshold });
  useEffect(() => {
    handlersRef.current = { fling, settle, threshold };
  });
  // The handlers below read handlersRef only when the gesture system invokes
  // them — the event-handler case the rule allows. The linter cannot see through
  // PanResponder.create to know that, so it is told here.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      // Horizontal intent only, so a vertical scroll elsewhere never steals the
      // card. A drag that starts during the exit animation is harmless: fling()
      // is already guarded, and the next front card resets position on mount.
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        const handlers = handlersRef.current;
        const far = Math.abs(gesture.dx) > handlers.threshold;
        const fast = Math.abs(gesture.vx) > FLING_VELOCITY;
        if (far || fast) handlers.fling(gesture.dx > 0 ? 'keep' : 'pass');
        else handlers.settle();
      },
      onPanResponderTerminate: () => handlersRef.current.settle(),
    }),
  );

  // A new front card — after a decision or an undo — starts centred, not where
  // the last one was released.
  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
  }, [front?.id, position]);

  // Only two cards are mounted, so the third onward would load on reveal and
  // show grey for a beat after every swipe. Warming a few ahead keeps a fast
  // run of decisions continuous; remote sources only — bundled ones are instant.
  useEffect(() => {
    const ahead = wants
      .slice(2, 2 + PREFETCH_AHEAD)
      .map((want) => want.photo)
      .filter((photo): photo is string => typeof photo === 'string');
    if (ahead.length) void Image.prefetch(ahead, 'memory-disk').catch(() => undefined);
  }, [wants]);

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [`-${MAX_TILT_DEG}deg`, '0deg', `${MAX_TILT_DEG}deg`],
  });
  const keepOpacity = position.x.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = position.x.interpolate({
    inputRange: [-threshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const rearScale = position.x.interpolate({
    inputRange: [-threshold, 0, threshold],
    outputRange: [1, REAR_SCALE, 1],
    extrapolate: 'clamp',
  });
  const rearOffset = position.x.interpolate({
    inputRange: [-threshold, 0, threshold],
    outputRange: [0, REAR_OFFSET, 0],
    extrapolate: 'clamp',
  });

  const cardHeight = Math.max(280, height);

  if (!front) return null;

  return (
    <View style={{ height }}>
      <View style={{ height: cardHeight }}>
        {behind ? (
          <Animated.View
            pointerEvents="none"
            // A preview of what is next, not a second card to announce.
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ scale: rearScale }, { translateY: rearOffset }] },
            ]}
          >
            <DeckCard want={behind} />
          </Animated.View>
        ) : null}

        <Animated.View
          {...responder.panHandlers}
          accessibilityLabel={t('core.home.deck.label')}
          accessibilityHint={t('core.home.deck.hint')}
          // With no buttons on screen, the decisions live here for assistive tech:
          // a screen reader lists Keep and Pass as actions on the card itself.
          accessibilityActions={[
            { name: 'keep', label: t('core.home.deck.keep') },
            { name: 'pass', label: t('core.home.deck.pass') },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'keep') fling('keep');
            if (event.nativeEvent.actionName === 'pass') fling('pass');
          }}
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
        >
          <DeckCard want={front} onPress={() => onOpen(front)} resurfaced={resurfacedIds?.has(front.id)}>
            {/* Sighted feedback for the drag. Screen readers get the same answer
                from the two labelled buttons, so the stamps stay silent. */}
            <Animated.View
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
              style={[styles.stamp, styles.keepStamp, { opacity: keepOpacity }]}
            >
              <Txt variant="eyebrow" className="text-brand-paper">{t('core.home.deck.keepStamp')}</Txt>
            </Animated.View>
            <Animated.View
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
              style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}
            >
              <Txt variant="eyebrow" className="text-brand-paper">{t('core.home.deck.passStamp')}</Txt>
            </Animated.View>
          </DeckCard>
        </Animated.View>
      </View>

    </View>
  );
}

function DeckCard({
  want,
  onPress,
  resurfaced = false,
  children,
}: {
  want: Want;
  onPress?: () => void;
  resurfaced?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const interests = useApp((state) => state.profile.interests);
  const because = matchedInterestLabel(interests ?? [], want.category);
  // The server's counts when it supplied them, the demo cast's table otherwise.
  // A friend wanting this is the strongest thing the card can say - it is the
  // difference between a number and an invitation - so it wins when there is one.
  const holders = want.holders ?? holdersOf(want).length;
  const friends = want.friendHolders ?? 0;
  const social = friends
    ? t('shared.common.friendsWant', { count: friends, formattedCount: formatNumber(friends) })
    : holders
      ? t('shared.common.wantsThis', { count: holders, formattedCount: formatNumber(holders) })
      : want.saves
        ? t('shared.common.savedCount', { count: want.saves, formattedCount: formatNumber(want.saves) })
        : t('shared.common.onlyYou');
  const scope = wantLocationScope(want);

  return (
    <FocusablePressable
      accessibilityRole="button"
      accessibilityLabel={wantTitle(want)}
      onPress={onPress}
      disabled={!onPress}
      style={StyleSheet.absoluteFill}
      className="rounded-[4px] overflow-hidden bg-brand-paper-sunk"
    >
      <BrandedImage source={want.photo} fallback={CATALOG_FALLBACK} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={SCRIM} locations={[0.35, 0.68, 1]} style={StyleSheet.absoluteFill} />
      {resurfaced ? (
        <View className="absolute top-5 self-center rounded-[4px] bg-brand-paper px-3 py-1">
          <Txt variant="eyebrow" className="text-brand-ink">{t('s.home.stillWant')}</Txt>
        </View>
      ) : null}
      <View className="flex-1 justify-end p-5">
        <Txt variant="eyebrow" className="text-brand-paper/80">
          {categoryLabel(want.category)}
          {scope ? ` · ${scope}` : ''}
        </Txt>
        <View className="mt-2">
          <ScrollingTitle variant="title" className="text-brand-paper" lines={2} lineHeight={32}>
            {wantTitle(want)}
          </ScrollingTitle>
        </View>
        {/* Why this card, and whether it takes company - the two questions a
            person asks before deciding, answered before they ask. */}
        <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 8 }}>
          <View className="flex-row items-center">
            <GoraIcon name="people" size={16} color={tint(C.paper, 'B8')} />
            <Txt variant="caption" className="text-brand-paper/70 ml-2">{social}</Txt>
          </View>
          {want.party === 'duo' || want.party === 'group' ? (
            <View className="rounded-full border border-brand-paper/30 px-2 py-[2px]">
              <Txt variant="caption" className="text-brand-paper/80">
                {want.party === 'duo' ? t('s.common.duo') : t('s.common.group')}
              </Txt>
            </View>
          ) : null}
        </View>
        {because ? (
          <Txt variant="caption" className="text-brand-paper/60 mt-2" numberOfLines={1}>
            {t('s.home.because', { interest: because })}
          </Txt>
        ) : null}
      </View>
      {children}
    </FocusablePressable>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  keepStamp: {
    left: 20,
    backgroundColor: C.orange,
    borderColor: C.paper,
    transform: [{ rotate: '-10deg' }],
  },
  passStamp: {
    right: 20,
    backgroundColor: C.night,
    borderColor: C.paper,
    transform: [{ rotate: '10deg' }],
  },
});
