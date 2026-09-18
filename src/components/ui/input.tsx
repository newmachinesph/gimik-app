/* Hallmark · component: input + chip · genre: playful-editorial · theme: studied-DNA
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass · border geometry: constant
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { C, RADIUS } from '@/lib/tokens';
import type { ControlState } from './button';
import { GimikIcon } from './icon';
import { Txt } from './txt';

export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        borderColor: focused ? C.focus : 'transparent',
        borderRadius: RADIUS.pill,
        borderWidth: 2,
        maxWidth: '100%',
        padding: 1,
      }}
    >
      <Pressable
        className={`gimik-control min-h-11 px-[18px] py-2 items-center justify-center rounded-[4px] border active:opacity-85 ${
          selected
            ? 'bg-brand-night border-brand-night'
            : 'bg-brand-paper border-brand-rule hover:bg-brand-paper-sunk'
        } ${disabled ? 'opacity-50' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onPress={onPress}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Txt
          variant="label"
          numberOfLines={2}
          ellipsizeMode="tail"
          className={selected ? 'text-brand-paper' : 'text-brand-ink'}
          style={{ color: selected ? C.paper : C.ink, flexShrink: 1, textAlign: 'center' }}
        >
          {label}
        </Txt>
      </Pressable>
    </View>
  );
}

/** Pinned filter action + reset, followed by a one-line category rail. */
export function FilterBar({
  options,
  value,
  onChange,
  onFilter,
  filtersActive = false,
  labelForOption = (option) => option,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  onFilter?: () => void;
  filtersActive?: boolean;
  labelForOption?: (option: string) => string;
}) {
  const { t } = useTranslation();
  const [pinned, ...rest] = options;
  return (
    <View className="flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={filtersActive ? t('shared.input.clearFilters') : t('shared.input.filter')}
        onPress={onFilter}
        className="w-11 h-11 rounded-full items-center justify-center bg-brand-paper border border-brand-rule mr-2 active:opacity-70"
      >
        <GimikIcon name="filter" size={20} color={C.ink} weight="bold" />
        {filtersActive ? (
          <View className="absolute top-[9px] right-[9px] w-2 h-2 rounded-full bg-brand-orange" />
        ) : null}
      </Pressable>

      {pinned ? (
        <View className="mr-1">
          <Chip label={labelForOption(pinned)} selected={pinned === value} onPress={() => onChange(pinned)} />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginRight: -20 }}
        contentContainerStyle={{ paddingRight: 20, gap: 4, alignItems: 'center' }}
      >
        {rest.map((option) => (
          <Chip
            key={option}
            label={labelForOption(option)}
            selected={option === value}
            onPress={() => onChange(option)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export type FieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  message?: string;
  state?: ControlState;
  /** Compact groups omit the empty helper row; input and touch sizes stay unchanged. */
  spacing?: 'default' | 'compact';
  /** Showcase-only forced state; real fields use pointer and focus events. */
  previewState?: 'hover' | 'focus';
};

export function Field({
  label,
  hint,
  message,
  state = 'idle',
  spacing = 'default',
  previewState,
  editable = true,
  multiline = false,
  onBlur,
  onFocus,
  style,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;
  const borderColor =
    state === 'error' ? C.danger : state === 'success' ? C.success : C.rule;
  const helperColor = state === 'error' ? C.danger : state === 'success' ? C.success : C.inkMuted;
  const helper = message ?? hint;

  const focus: NonNullable<TextInputProps['onFocus']> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  const blur: NonNullable<TextInputProps['onBlur']> = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View className={spacing === 'compact' ? 'mb-3' : 'mb-5'} collapsable={false}>
      {label ? (
        <Txt variant="eyebrow" className="mb-2">
          {label}
        </Txt>
      ) : null}
      <View
        // Keep the native parents stable as focus/disabled opacity changes.
        // Fabric on Android otherwise reparents the input's status slot while
        // the form is submitting, which can crash with "child already has a parent".
        collapsable={false}
        style={{
          borderColor: focused || previewState === 'focus' ? C.focus : 'transparent',
          borderRadius: RADIUS.input + 4,
          borderWidth: 2,
          opacity: disabled ? 0.55 : 1,
          padding: 2,
        }}
      >
        <View
          collapsable={false}
          style={{
            alignItems: multiline ? 'stretch' : 'center',
            backgroundColor: previewState === 'hover' ? C.paper : C.paperSunk,
            borderColor,
            borderRadius: RADIUS.input,
            borderWidth: 1,
            flexDirection: 'row',
            minHeight: multiline ? 112 : 52,
            paddingHorizontal: 16,
          }}
        >
          <TextInput
            {...rest}
            className="gimik-control font-geist leading-[22px] text-[16px] text-brand-ink"
            aria-invalid={state === 'error'}
            accessibilityLabel={rest.accessibilityLabel ?? label}
            accessibilityState={{ disabled, busy: state === 'loading' }}
            editable={editable}
            multiline={multiline}
            onBlur={blur}
            onFocus={focus}
            placeholderTextColor={C.inkMuted}
            style={[
              {
                flex: 1,
                minHeight: multiline ? 96 : 48,
                paddingVertical: multiline ? 14 : 0,
                textAlignVertical: multiline ? 'top' : 'center',
              },
              style,
            ]}
          />
          <View className="w-6 items-end justify-center">
            {state === 'loading' ? (
              <ActivityIndicator color={C.skyDeep} size="small" />
            ) : state === 'error' ? (
              <GimikIcon name="warning" size={19} color={C.danger} weight="bold" />
            ) : state === 'success' ? (
              <GimikIcon name="success" size={19} color={C.success} weight="bold" />
            ) : null}
          </View>
        </View>
      </View>
      <View style={{ minHeight: helper || spacing === 'default' ? 18 : 0, marginTop: helper || spacing === 'default' ? 4 : 0 }}>
        {helper ? (
          <Txt variant="caption" accessibilityLiveRegion="polite" style={{ color: helperColor }}>
            {helper}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

export function SearchField(props: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const { onBlur, onFocus, style, ...rest } = props;
  return (
    <View
      style={{
        borderColor: focused ? C.focus : 'transparent',
        borderRadius: RADIUS.input + 4,
        borderWidth: 2,
        padding: 2,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: C.paperSunk,
          borderColor: C.rule,
          borderRadius: RADIUS.input,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: 16,
        }}
      >
        <GimikIcon name="search" size={19} color={C.inkMuted} weight="bold" />
        <TextInput
          {...rest}
          className="gimik-control font-geist leading-[22px] text-[16px] text-brand-ink"
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={C.inkMuted}
          style={[{ flex: 1, marginLeft: 10, paddingVertical: 14 }, style]}
        />
      </View>
    </View>
  );
}
