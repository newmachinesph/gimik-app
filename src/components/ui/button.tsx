/* Hallmark · component: button · genre: playful-editorial · theme: studied-DNA
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (paper/primary 4.83 · ink/sky 8.09 · paper/night 17.21)
 */

import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { C, tint } from '@/lib/tokens';
import { GoraIcon, type IconName } from './icon';
import { Txt } from './txt';

export type ControlState = 'idle' | 'loading' | 'error' | 'success';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  state?: ControlState;
  stateLabel?: string;
  variant?: ButtonVariant;
  tone?: 'light' | 'dark';
  accent?: boolean;
  /** Showcase-only forced state; real controls use pointer and focus events. */
  previewState?: 'hover' | 'focus' | 'active';
};

/**
 * The system button. Primary actions use deep orange with warm paper text.
 * State feedback changes icon, border, and label together, never colour alone.
 */
export function Button({
  label,
  onPress,
  icon,
  disabled = false,
  state = 'idle',
  stateLabel,
  variant = 'primary',
  tone = 'light',
  accent = false,
  previewState,
}: ButtonProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const blocked = disabled || state === 'loading';

  let skin = 'bg-brand-primary border-brand-primary';
  let textColor = 'text-brand-primary-ink';
  let foreground: string = C.primaryInk;

  if (variant === 'secondary') {
    skin =
      tone === 'dark'
        ? 'bg-brand-night border-brand-rule-invert'
        : 'bg-brand-paper border-brand-rule';
    textColor = tone === 'dark' ? 'text-brand-paper' : 'text-brand-ink';
    foreground = tone === 'dark' ? C.paper : C.ink;
  }

  if (variant === 'ghost') {
    skin = 'bg-transparent border-transparent';
    textColor = tone === 'dark' ? 'text-brand-paper' : accent ? 'text-brand-orange-deep' : 'text-brand-ink-muted';
    foreground = tone === 'dark' ? C.paper : accent ? C.orangeDeep : C.inkMuted;
  }

  if (state === 'error') {
    skin = 'bg-brand-paper-sunk border-brand-danger';
    textColor = 'text-brand-danger';
    foreground = C.danger;
  } else if (state === 'success') {
    skin = 'bg-brand-paper-sunk border-brand-success';
    textColor = 'text-brand-success';
    foreground = C.success;
  } else if ((hovered || previewState === 'hover') && !blocked && variant !== 'ghost') {
    skin =
      variant === 'primary'
        ? 'bg-brand-primary border-brand-night'
        : tone === 'dark'
          ? 'bg-brand-night border-brand-paper/45'
          : 'bg-brand-paper border-brand-ink-muted';
  }

  if (disabled && state === 'idle') {
    skin = 'bg-brand-paper-sunk border-brand-rule';
    textColor = 'text-brand-ink-muted';
    foreground = C.inkMuted;
  }

  const statusIcon: IconName | undefined =
    state === 'error' ? 'warning' : state === 'success' ? 'success' : undefined;
  const visibleLabel = stateLabel ?? label;
  const splitAction = Boolean(icon && state === 'idle' && variant === 'primary');

  return (
    <View
      className={`rounded-[4px] border-2 p-[2px] ${
        focused || previewState === 'focus' ? 'border-brand-focus' : 'border-transparent'
      }`}
    >
      <Pressable
        className={`gora-control min-h-[52px] flex-row items-center rounded-[4px] border px-5 py-3 active:scale-[0.985] ${
          previewState === 'active' ? 'scale-[0.985]' : ''
        } ${splitAction ? 'justify-between' : 'justify-center'} ${skin}`}
        accessibilityRole="button"
        accessibilityLiveRegion={state === 'idle' ? 'none' : 'polite'}
        accessibilityState={{ disabled: blocked, busy: state === 'loading' }}
        disabled={blocked}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
      >
        {state === 'loading' ? (
          <ActivityIndicator color={foreground} size="small" style={{ marginRight: 8 }} />
        ) : statusIcon ? (
          <GoraIcon name={statusIcon} size={18} color={foreground} weight="bold" style={{ marginRight: 8 }} />
        ) : null}
        <Txt
          variant="button"
          numberOfLines={2}
          ellipsizeMode="tail"
          className={`shrink ${textColor}`}
          style={{ flexShrink: 1, minWidth: 0, textAlign: 'center' }}
        >
          {visibleLabel}
        </Txt>
        {icon && state === 'idle' && variant === 'primary' ? (
          <View className={`ml-4 h-8 w-8 shrink-0 items-center justify-center rounded-full ${disabled ? 'bg-brand-rule' : 'bg-brand-paper/15'}`}>
            <GoraIcon name={icon} size={17} color={disabled ? C.inkMuted : C.primaryInk} weight="bold" />
          </View>
        ) : icon && state === 'idle' ? (
          <GoraIcon name={icon} size={18} color={foreground} weight="bold" style={{ marginLeft: 8 }} />
        ) : null}
      </Pressable>
    </View>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant' | 'tone'>) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton({
  tone = 'light',
  ...props
}: Omit<ButtonProps, 'variant' | 'tone'> & { tone?: 'light' | 'glass' | 'ink' }) {
  return <Button {...props} variant="secondary" tone={tone === 'light' ? 'light' : 'dark'} />;
}

export function GhostButton({
  tone = 'orange',
  ...props
}: Omit<ButtonProps, 'variant' | 'tone' | 'accent'> & {
  tone?: 'orange' | 'white' | 'muted';
}) {
  return (
    <Button
      {...props}
      variant="ghost"
      tone={tone === 'white' ? 'dark' : 'light'}
      accent={tone === 'orange'}
    />
  );
}

/**
 * The visible diameter of an IconButton, and the gap between that circle and
 * the edge of the box it sits in (a 2px focus ring plus 2px of padding).
 *
 * Exported because anything placed beside one - a composer field, an avatar -
 * has to match the *circle*, not the box, and hard-coding 44 gets it wrong by
 * exactly this inset.
 */
export const ICON_BUTTON_SIZE = 44;
export const ICON_BUTTON_INSET = 4;

/** Bordered circular icon control for headers and toolbars. */
export function IconButton({
  icon,
  onPress,
  size = ICON_BUTTON_SIZE,
  tone = 'light',
  label,
  disabled = false,
  state = 'idle',
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  tone?: 'light' | 'glass';
  label: string;
  disabled?: boolean;
  state?: ControlState;
}) {
  const [focused, setFocused] = useState(false);
  const backgroundColor = tone === 'glass' ? C.night : C.paper;
  const foreground = tone === 'glass' ? C.paper : C.ink;
  const blocked = disabled || state === 'loading';

  return (
    <View
      style={{
        alignItems: 'center',
        borderColor: focused ? C.focus : 'transparent',
        borderRadius: size / 2 + 4,
        borderWidth: 2,
        height: size + 8,
        justifyContent: 'center',
        padding: 2,
        width: size + 8,
      }}
    >
      <Pressable
        className="gora-control active:scale-[0.96]"
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy: state === 'loading' }}
        disabled={blocked}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onPress={onPress}
        style={{
          alignItems: 'center',
          backgroundColor,
          borderColor: state === 'error' ? C.danger : state === 'success' ? C.success : C.rule,
          borderRadius: size / 2,
          borderWidth: 1,
          height: size,
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          width: size,
        }}
      >
        {state === 'loading' ? (
          <ActivityIndicator color={foreground} size="small" />
        ) : (
          <GoraIcon
            name={state === 'error' ? 'warning' : state === 'success' ? 'check' : icon}
            size={size * 0.45}
            color={state === 'error' ? C.danger : state === 'success' ? C.success : foreground}
            weight="bold"
          />
        )}
      </Pressable>
    </View>
  );
}

/** Icon on a quiet tint. Brand states stay orange or sky; semantic states are reserved for feedback. */
export function IconTile({
  name,
  tone = 'orange',
  size = 44,
}: {
  name: IconName;
  tone?: 'orange' | 'blue' | 'green' | 'violet' | 'red';
  size?: number;
}) {
  const map = {
    orange: C.orangeDeep,
    blue: C.skyDeep,
    green: C.success,
    violet: C.orangeDeep,
    red: C.danger,
  };
  const color = map[tone];
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: tint(color),
        borderRadius: 4,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      <GoraIcon
        name={name}
        size={size * 0.5}
        color={color}
        duotoneColor={color}
        duotoneOpacity={0.18}
        weight="duotone"
      />
    </View>
  );
}
