import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { C } from '@/lib/tokens';
import { Card, Divider } from './card';
import { GoraIcon, type IconName } from './icon';
import { Avatar } from './photo';
import { FocusablePressable } from './pressable';
import { Txt } from './txt';

/**
 * A card of rows with hairlines between them.
 *
 * Every list in the app is this shape, and it used to be written out at each
 * call site as `{index ? <Divider /> : null}` inside a map — which meant the
 * divider could be forgotten, doubled, or drawn on the wrong edge. The card
 * owns its own separators now, so a list is just its rows.
 */
export const ROW_LIST_GUTTER = 16;

export function RowList({ children, className = '' }: { children: ReactNode; className?: string }) {
  const rows = Children.toArray(children).filter(isValidElement);
  if (!rows.length) return null;
  return (
    <Card className={`px-4 ${className}`}>
      {rows.map((row, index) => (
        <View key={row.key ?? index}>
          {index ? <Divider /> : null}
          {row}
        </View>
      ))}
    </Card>
  );
}

/** The orange count pill: new invites, unread threads, pending requests. */
export function CountBadge({ count, label }: { count: number; label?: string }) {
  if (!count) return null;
  return (
    <View className="bg-brand-orange rounded-full px-2 py-[2px]">
      <Txt variant="caption" className="text-brand-paper">{label ?? count}</Txt>
    </View>
  );
}

/**
 * The one list row. Something on the left, a title and a caption, something on
 * the right, and a chevron when tapping it goes somewhere.
 *
 * Leading art is declared rather than passed as a node so that avatars and
 * icon discs stay the same size everywhere; `leading` is the escape hatch for
 * the rows that carry a thumbnail.
 */
export function NavRow({
  icon,
  avatar,
  avatarPhoto,
  leading,
  title,
  caption,
  meta,
  count,
  badge,
  trailing,
  tone = 'ink',
  chevron = true,
  size = 'md',
  emphasis = false,
  onPress,
  onLeadingPress,
  disabled = false,
  accessibilityLabel,
}: {
  /** Leading icon, drawn bare at list scale. */
  icon?: IconName;
  /** Leading initials avatar, from a person's name. */
  avatar?: string;
  avatarPhoto?: string;
  /** Anything else — a thumbnail, an icon disc. */
  leading?: ReactNode;
  title: string;
  caption?: string;
  /** Right-aligned on the title line: a timestamp, mostly. */
  meta?: string;
  /** Quiet trailing number. */
  count?: number;
  /** Loud trailing number — the orange pill. */
  badge?: number;
  /** Replaces the chevron entirely. */
  trailing?: ReactNode;
  tone?: 'ink' | 'danger';
  chevron?: boolean;
  size?: 'md' | 'lg';
  /** Unread: the title goes full ink and the caption stops being muted. */
  emphasis?: boolean;
  onPress?: () => void;
  /** Makes the leading art its own tap target — an avatar that opens a profile. */
  onLeadingPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const danger = tone === 'danger';
  const art = leading ?? (avatar !== undefined ? (
    <Avatar name={avatar} size={size === 'lg' ? 44 : 40} source={avatarPhoto} />
  ) : icon ? (
    <GoraIcon name={icon} size={20} color={danger ? C.orange : C.ink} />
  ) : null);

  return (
    <FocusablePressable
      // A row that goes nowhere is text, and screen readers should not offer
      // it as a button just because it is built out of one.
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? accessibilityLabel ?? title : undefined}
      disabled={disabled || !onPress}
      onPress={onPress}
      className={`flex-row items-center ${size === 'lg' ? 'py-4' : 'py-3'} active:opacity-70`}
    >
      {art ? (
        onLeadingPress ? (
          <FocusablePressable accessibilityRole="button" accessibilityLabel={avatar ?? title} onPress={onLeadingPress} className="active:opacity-70">
            {art}
          </FocusablePressable>
        ) : (
          art
        )
      ) : null}
      <View className={`flex-1 min-w-0 ${art ? 'ml-3' : ''}`}>
        <View className="flex-row items-center">
          <Txt variant="label" numberOfLines={1} className={`flex-1 ${danger ? 'text-brand-orange' : 'text-brand-ink'}`}>
            {title}
          </Txt>
          {meta ? <Txt variant="caption" className="ml-2">{meta}</Txt> : null}
        </View>
        {caption ? (
          <Txt variant="caption" numberOfLines={1} className={`mt-1 ${emphasis ? 'text-brand-ink' : ''}`}>
            {caption}
          </Txt>
        ) : null}
      </View>
      {badge ? <View className="ml-2"><CountBadge count={badge} /></View> : null}
      {count !== undefined ? <Txt variant="caption" className="ml-2">{count}</Txt> : null}
      {trailing ? <View className="shrink-0 ml-2">{trailing}</View> : null}
      {!trailing && chevron && onPress ? (
        <GoraIcon name="chevron-right" size={16} color={C.inkMuted} style={{ marginLeft: 8 }} />
      ) : null}
    </FocusablePressable>
  );
}

/**
 * A small pill that commits to something — "Ask", mostly. Not a Button: it
 * lives inside a row, so it may not claim the 52px height a Button does.
 *
 * `quiet` is the default because these sit in rows that already have an
 * avatar. A filled dark pill beside a filled dark avatar read as a second
 * avatar rather than a control, and a column of them buried the screen's
 * actual primary action. Reserve `night` for a pill that is the only thing to
 * do on its row.
 *
 * The geometry is set here rather than left to padding. A one-word label like
 * "Ask" is too short to shape a pill on its own: with symmetric padding it
 * comes out roughly as wide as it is tall and reads as a blob. Forcing a
 * minimum 2:1 keeps it unmistakably a pill however short the word, and
 * hitSlop makes up the touch target the reduced height gives away.
 */
export function PillButton({
  label,
  onPress,
  tone = 'quiet',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  tone?: 'night' | 'quiet';
  accessibilityLabel?: string;
}) {
  const night = tone === 'night';
  return (
    <FocusablePressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      // The pill is deliberately shorter than a Button, so the touch target is
      // made up with hitSlop instead: 36 + 6 either side clears 44.
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 76,
        height: 36,
        paddingHorizontal: 16,
      }}
      className={`shrink-0 rounded-full active:opacity-80 ${night ? 'bg-brand-night' : 'border border-brand-rule bg-brand-paper-sunk'}`}
    >
      <Txt variant="caption" className={night ? 'text-brand-paper' : 'text-brand-ink'}>{label}</Txt>
    </FocusablePressable>
  );
}

/** A read-only pill: an interest, a spoken language, a category lean. */
export function Tag({ label, tone = 'filled' }: { label: string; tone?: 'filled' | 'outline' }) {
  return (
    <View className={`rounded-full border border-brand-rule px-3 py-1 ${tone === 'filled' ? 'bg-brand-paper-sunk' : ''}`}>
      <Txt variant="caption" className={tone === 'filled' ? 'text-brand-ink' : ''}>{label}</Txt>
    </View>
  );
}
