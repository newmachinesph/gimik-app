import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Children, type Ref } from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, GoraIcon, type IconName, ProgressRing, TAB_BAR_HEIGHT, Txt } from '@/components/ui';
import { C } from '@/lib/tokens';

/** Flat paper bar, five labelled destinations, the deck in the middle. */
export function TabBar({ children, ...rest }: ViewProps & { ref?: Ref<View> }) {
  const insets = useSafeAreaInsets();
  return (
    <View {...rest} style={[styles.bar, { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }]}>
      {Children.toArray(children)}
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  /** A name renders the person's avatar in place of the icon - the Profile tab. */
  avatar?: string;
  photo?: string;
  /** 0-1 profile completeness; drawn as the ring around the avatar. */
  progress?: number;
  /** Unread count; hidden at zero. */
  badge?: number;
  ref?: Ref<View>;
};

export function TabButton({ icon, avatar, photo, progress, badge = 0, children, isFocused, ...rest }: TabButtonProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ selected: !!isFocused }}
      className="active:opacity-60"
      // TabTrigger's asChild merges flexDirection:row + space-between onto this
      // Pressable after className; an inline style wins that merge.
      style={styles.trigger}
    >
      <View className="flex-1 items-center justify-center">
        <View>
          {avatar ? (
            progress !== undefined ? (
              // The same completion arc as the profile screen, in miniature:
              // the tab shows how far the profile is at a glance.
              <View style={isFocused ? null : styles.avatarDim}>
                <ProgressRing value={progress} size={28} stroke={2} gap={1}>
                  <Avatar name={avatar} size={20} source={photo} />
                </ProgressRing>
              </View>
            ) : (
              <View style={[styles.avatarRing, isFocused ? styles.avatarRingActive : null]}>
                <Avatar name={avatar} size={22} source={photo} />
              </View>
            )
          ) : (
            <GoraIcon name={icon} size={24} color={isFocused ? C.ink : C.inkMuted} weight={isFocused ? 'fill' : 'regular'} />
          )}
          {badge > 0 ? (
            <View style={styles.badge}>
              <Txt variant="caption" className="text-brand-paper" style={styles.badgeText}>
                {badge > 9 ? '9+' : String(badge)}
              </Txt>
            </View>
          ) : null}
        </View>
        <Txt variant="caption" className={isFocused ? 'text-brand-ink' : ''} style={styles.label}>
          {children}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 3, fontSize: 10, lineHeight: 12 },
  avatarRing: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarRingActive: { borderColor: C.ink },
  avatarDim: { opacity: 0.75 },
  badge: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, lineHeight: 12 },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.paper, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.rule,
  },
});