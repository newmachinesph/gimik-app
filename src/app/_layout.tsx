import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { ErrorBoundary } from '@/components/error-boundary';
import { startMonitoring } from '@/lib/monitoring';
import { hasApi, restoreSession, watchSessionExpiry } from '@/lib/api/session';
import { LOCALE } from '@/i18n';
import { C, FONT } from '@/lib/tokens';
import { useApp } from '@/store';

const Geist_400Regular = require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf') as number;
const Geist_500Medium = require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf') as number;
const Geist_600SemiBold = require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf') as number;
const Geist_700Bold = require('@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf') as number;
const Geist_800ExtraBold = require('@expo-google-fonts/geist/800ExtraBold/Geist_800ExtraBold.ttf') as number;
const GeistMono_400Regular = require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf') as number;
const GeistMono_500Medium = require('@expo-google-fonts/geist-mono/500Medium/GeistMono_500Medium.ttf') as number;
const InstrumentSerif_400Regular_Italic = require('@expo-google-fonts/instrument-serif/400Regular_Italic/InstrumentSerif_400Regular_Italic.ttf') as number;

SplashScreen.preventAutoHideAsync();

// Before the first render, so a crash on the way up is still reported.
startMonitoring();

export default function RootLayout() {
  useEffect(watchSessionExpiry, []);
  const hydrated = useApp((state) => state.hydrated);
  const onboarded = useApp((state) => state.onboarded);
  const [restored, setRestored] = useState(!hasApi);
  useEffect(() => {
    if (!hydrated || !hasApi) return;
    let mounted = true;
    void restoreSession().catch(() => false).finally(() => { if (mounted) setRestored(true); });
    return () => { mounted = false; };
  }, [hydrated]);
  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    InstrumentSerif_400Regular_Italic,
  });

  // Copy resolves synchronously (one locale, `initAsync: false`), so the only
  // things the splash waits on are the typefaces and the persisted store.
  useEffect(() => {
    if ((loaded || error) && hydrated && restored) SplashScreen.hideAsync();
  }, [error, hydrated, loaded, restored]);

  if ((!loaded && !error) || !hydrated || !restored) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent preserveEdgeToEdge preload={false}>
        <View style={{ flex: 1 }} accessibilityLanguage={LOCALE}>
          <StatusBar style="dark" />
          <ErrorBoundary onReset={() => useApp.getState().reset()}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
            <Stack.Screen name="index" />
            <Stack.Protected guard={!onboarded}>
              <Stack.Screen name="welcome" />
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="forgot" />
              <Stack.Screen name="reset" />
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
            <Stack.Protected guard={onboarded}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="want/[id]" />
              <Stack.Screen name="person/[name]" />
              <Stack.Screen name="lock/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="plan/[id]" />
              <Stack.Screen name="journal/[id]" />
              <Stack.Screen name="create" options={{ presentation: 'modal' }} />
              <Stack.Screen name="messages/index" />
              <Stack.Screen name="messages/[id]" />
              <Stack.Screen name="friends" />
              <Stack.Screen name="groups/index" />
              <Stack.Screen name="groups/[id]" />
              <Stack.Screen name="join/[token]" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="plus" />
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="interests" />
              <Stack.Screen name="city" />
            </Stack.Protected>
          </Stack>
          </ErrorBoundary>
          {/* One quiet reporter for every state change. Confirmations stay as
              alerts; the toaster only ever tells you what just happened. */}
          <Toaster
            // Top rather than bottom: at the bottom a notice lands on the tab
            // bar and on footer CTAs - covering the very control it is
            // reporting on - and it competes with the system gesture bar.
            position="top-center"
            // Below the status bar *and* the screen header, so a notice never
            // sits on the title or on the filter button in the corner - which
            // is the same mistake the bottom position made with the tab bar.
            offset={120}
            duration={2600}
            gap={8}
            visibleToasts={2}
            // sonner-native only offers top/bottom/center, so the right edge is
            // done here: the positioner is full width, and aligning its items to
            // the end pins the toast right while the padding keeps it off the
            // screen edge. Inset on the positioner rather than a margin on the
            // toast - a margin only shifts the toast and overflows the far side.
            positionerStyle={{ paddingHorizontal: 16, alignItems: 'flex-end' }}
            icons={{ info: <></>, success: <></>, error: <></>, warning: <></>, loading: <></> }}
            toastOptions={{
              // An explicit width, not `auto`: sonner lays the title out inside
              // a flexing row, so an auto-width toast collapses to a small
              // square with the text squeezed out of it. 300dp leaves a clear
              // margin on the left of a phone - so it reads as pinned to the
              // right - and still fits a two-line notice.
              style: { backgroundColor: C.night, borderRadius: 4, borderWidth: 0, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-end', width: 300 },
              titleStyle: { color: C.paper, fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 },
              descriptionStyle: { color: `${C.paper}B3`, fontFamily: FONT.regular, fontSize: 12, lineHeight: 16 },
              actionButtonStyle: { backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 4 },
              actionButtonTextStyle: { color: C.orange, fontFamily: FONT.semibold, fontSize: 13 },
            }}
          />
        </View>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
