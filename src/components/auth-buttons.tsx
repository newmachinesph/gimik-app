import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FocusablePressable, Txt } from '@/components/ui';

/**
 * Brand-correct sign-in buttons with the official marks, drawn to each
 * vendor's guidelines: Google on a white surface with the four-colour G,
 * Apple in solid black with the white apple.
 *
 * Demo note: the handlers are the caller's; when the API arrives these wire
 * to expo-auth-session (Google) and expo-apple-authentication (Apple's own
 * native button on iOS) without the visuals changing.
 */

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

function AppleMark({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 512">
      <Path
        fill={color}
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </Svg>
  );
}

export function GoogleButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <FocusablePressable
      accessibilityRole="button"
      disabled={disabled}
      style={disabled ? { opacity: 0.45 } : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center justify-center rounded-[4px] border border-brand-rule bg-white py-3 active:opacity-80"
    >
      <GoogleG />
      <Txt variant="label" className="ml-3" style={{ color: '#1F1F1F', fontFamily: 'Geist_600SemiBold' }}>{label}</Txt>
    </FocusablePressable>
  );
}

export function AppleButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <FocusablePressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center justify-center rounded-[4px] py-3 active:opacity-80"
      style={{ backgroundColor: '#000000', opacity: disabled ? 0.45 : 1 }}
    >
      <View style={{ marginTop: -2 }}><AppleMark /></View>
      <Txt variant="label" className="ml-3" style={{ color: '#FFFFFF', fontFamily: 'Geist_600SemiBold' }}>{label}</Txt>
    </FocusablePressable>
  );
}
