import palette from './colors';

/**
 * Native Gora tokens for values that cannot travel through NativeWind classes
 * (icons, animated styles, dimensions, and font family names).
 */
export const C = {
  paper: palette.paper,
  paperSunk: palette['paper-sunk'],
  ink: palette.ink,
  inkMuted: palette['ink-muted'],
  orange: palette.orange,
  orangeDeep: palette['orange-deep'],
  primary: palette.primary,
  primaryInk: palette['primary-ink'],
  sky: palette.sky,
  skyDeep: palette['sky-deep'],
  night: palette.night,
  rule: palette.rule,
  ruleInvert: palette['rule-invert'],
  focus: palette.focus,
  success: palette.success,
  danger: palette.danger,

  // Compatibility aliases. Prefer the semantic names above in new components.
  blue: palette.sky,
  blueDark: palette['sky-deep'],
  orangeDark: palette['orange-deep'],
  muted: palette['ink-muted'],
  faint: palette['ink-muted'],
  surface: palette.paper,
  white: palette.paper,
  line: palette.rule,
  green: palette.success,
  red: palette.danger,
  violet: palette['orange-deep'],
  track: palette['paper-sunk'],
} as const;

// Registered in the root layout. Instrument Serif is an accent voice for the
// word “someday” and close variants, never a general heading face.
export const FONT = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  black: 'Geist_800ExtraBold',
  mono: 'GeistMono_500Medium',
  monoRegular: 'GeistMono_400Regular',
  someday: 'InstrumentSerif_400Regular_Italic',
} as const;

export const SPACE = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

// One radius. Every rectangular surface — cards, buttons, inputs, chips, photo
// tiles — sits at 4. The keys stay so callers still say what they are drawing;
// true circles (avatars, round icon buttons, dots) are not radii and do not
// use this table.
export const RADIUS = {
  input: 4,
  button: 4,
  card: 4,
  photo: 4,
  tab: 4,
  pill: 4,
} as const;

export const MOTION = {
  micro: 120,
  short: 220,
  long: 420,
  /**
   * A beat longer than a stack transition takes to commit.
   *
   * Mounting views while the router is still swapping trees makes Fabric mount
   * into a surface the outgoing screen has not finished releasing, and the app
   * dies with "child already has a parent". Anything that can appear on a
   * screen's first frames - a sheet, a deck arriving from the network - waits
   * this long first. (InteractionManager would say it better and is deprecated;
   * a timeout is the boring replacement.)
   */
  settle: 450,
} as const;

/** Translucent tint of a six-digit native hex colour. */
export const tint = (color: string, alpha = '1A') => `${color}${alpha}`;
