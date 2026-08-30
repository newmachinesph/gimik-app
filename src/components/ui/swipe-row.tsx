import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { C } from '@/lib/tokens';
import { GoraIcon, type IconName } from './icon';
import { FocusablePressable } from './pressable';
import { Txt } from './txt';

const ACTION_WIDTH = 96;
/** How far left the row must travel before letting go opens it. */
const OPEN_FRACTION = 0.4;
const FLING_VELOCITY = 0.5;
const SPRING = { tension: 70, friction: 11, useNativeDriver: true } as const;

export type SwipeAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
  /** `danger` is the irreversible one — hiding a person, not declining an invite. */
  tone?: 'quiet' | 'danger';
};

/**
 * A list row that slides left to reveal its actions.
 *
 * Built on PanResponder for the same reason the deck is: it is the gesture
 * system already in this app, and one is enough. The row never opens on a
 * vertical drag, so a swipe inside a scrolling list still scrolls the list.
 *
 * The actions are a reveal, not a shortcut — everything behind the swipe is
 * also reachable by tapping the row, because a gesture nobody discovers is not
 * an affordance.
 */
export function SwipeRow({
  actions,
  children,
  gutter = 0,
  closeLabel = 'Close actions',
}: {
  actions: SwipeAction[];
  children: React.ReactNode;
  /** Announced for the tap target that closes an opened row. */
  closeLabel?: string;
  /** Horizontal padding of the surface this sits in, cancelled so the actions
   *  reach the card's edge while the row's own content keeps its inset. */
  gutter?: number;
}) {
  const [translate] = useState(() => new Animated.Value(0));
  // Mirrored in state as well as a ref: the ref is what the gesture callbacks
  // read, the state is what decides whether the content is still tappable.
  const [isOpen, setIsOpen] = useState(false);
  const openWidth = ACTION_WIDTH * actions.length;
  const openRef = useRef(false);

  const close = useCallback(() => {
    openRef.current = false;
    setIsOpen(false);
    Animated.spring(translate, { toValue: 0, ...SPRING }).start();
  }, [translate]);

  const open = useCallback(() => {
    openRef.current = true;
    setIsOpen(true);
    Animated.spring(translate, { toValue: -openWidth, ...SPRING }).start();
  }, [openWidth, translate]);

  // The responder is created once; its handlers read the current open/close
  // through a ref an effect keeps fresh, so the gesture is never re-attached
  // mid-drag and nothing reads a ref during render.
  const handlersRef = useRef({ open, close, openWidth });
  useEffect(() => {
    handlersRef.current = { open, close, openWidth };
  });

  // eslint-disable-next-line react-hooks/refs -- read only when the gesture system calls back
  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_, gesture) => {
        const base = openRef.current ? -handlersRef.current.openWidth : 0;
        // Rightward past closed is nothing to reveal, so it simply does not move.
        const next = Math.min(0, Math.max(-handlersRef.current.openWidth, base + gesture.dx));
        translate.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const { open: doOpen, close: doClose, openWidth: width } = handlersRef.current;
        const base = openRef.current ? -width : 0;
        const travelled = base + gesture.dx;
        if (gesture.vx < -FLING_VELOCITY || travelled < -width * OPEN_FRACTION) doOpen();
        else doClose();
      },
      onPanResponderTerminate: () => handlersRef.current.close(),
    }),
  );

  return (
    <View className="overflow-hidden" style={{ marginHorizontal: -gutter }}>
      <View className="absolute right-0 top-0 bottom-0 flex-row">
        {actions.map((action) => (
          <FocusablePressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              close();
              action.onPress();
            }}
            style={{ width: ACTION_WIDTH }}
            className={`items-center justify-center active:opacity-80 ${action.tone === 'danger' ? 'bg-brand-orange' : 'bg-brand-paper-sunk'}`}
          >
            <GoraIcon
              name={action.icon}
              size={18}
              color={action.tone === 'danger' ? C.paper : C.ink}
              weight="bold"
            />
            <Txt
              variant="caption"
              numberOfLines={1}
              className={`mt-1 ${action.tone === 'danger' ? 'text-brand-paper' : 'text-brand-ink'}`}
            >
              {action.label}
            </Txt>
          </FocusablePressable>
        ))}
      </View>
      <Animated.View
        {...responder.panHandlers}
        className="bg-brand-paper"
        style={{ paddingHorizontal: gutter, transform: [{ translateX: translate }] }}
      >
        {children}
        {/* While the actions are showing, the row itself is a close button.
            Opening a thread because someone tapped the thing they had just
            slid aside is the wrong answer to that tap. */}
        {isOpen ? (
          <FocusablePressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}
