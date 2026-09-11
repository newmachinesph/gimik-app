// Gimik brand palette. This is the native source of truth; Tailwind consumes it
// directly and `tokens.ts` exposes the same values to style props.
//
// The first group mirrors getgoraapp/src/styles/tokens.css exactly. Compatibility
// aliases remain below so existing screens inherit the brand without carrying a
// second visual language while they migrate to the semantic names.
module.exports = {
  paper: '#FBF7F0',
  'paper-sunk': '#F3EDE2',
  ink: '#16130F',
  'ink-muted': '#6B6259',
  orange: '#FF5C24',
  'orange-deep': '#C63D0B',
  primary: '#C63D0B',
  'primary-ink': '#FBF7F0',
  sky: '#38B6F5',
  'sky-deep': '#0A6FA8',
  night: '#0B1520',
  rule: 'rgba(22,19,15,0.14)',
  'rule-invert': 'rgba(251,247,240,0.16)',
  focus: '#0A6FA8',

  // Product feedback colours. These are semantic only, never decorative.
  success: '#2E7459',
  danger: '#A83D2C',

  // Compatibility aliases for the existing boilerplate.
  blue: '#38B6F5',
  'blue-dark': '#0A6FA8',
  'orange-dark': '#C63D0B',
  muted: '#6B6259',
  faint: '#6B6259',
  surface: '#FBF7F0',
  white: '#FBF7F0',
  line: 'rgba(22,19,15,0.14)',
  green: '#2E7459',
  red: '#A83D2C',
  violet: '#C63D0B',
  track: '#F3EDE2',
};
