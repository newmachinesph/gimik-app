import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { ErrorBoundary } from '@/components/error-boundary';
import { startMonitoring } from '@/lib/monitoring';
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
  const hydrated = useApp((state) => state.hydrated);
  const onboarded = useApp((state) => state.onboarded);
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
    if ((loaded || error) && hydrated) SplashScreen.hideAsync();
  }, [error, hydrated, loaded]);

  if ((!loaded && !error) || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} accessibilityLanguage={LOCALE}>
          <StatusBar style="dark" />
          <ErrorBoundary onReset={() => useApp.getState().reset()}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="forgot" />
            <Stack.Screen name="reset" />
            <Stack.Screen name="onboarding" />
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
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="interests" />
              <Stack.Screen name="city" />
            </Stack.Protected>
          </Stack>
          </ErrorBoundary>
          {/* One quiet reporter for every state change. Confirmations stay as
              alerts; the toaster only ever tells you what just happened. */}
          <Toaster
            position="bottom-center"
            offset={96}
            duration={2600}
            gap={8}
            visibleToasts={2}
            icons={{ info: <></>, success: <></>, error: <></>, warning: <></>, loading: <></> }}
            toastOptions={{
              style: { backgroundColor: C.night, borderRadius: 4, borderWidth: 0, paddingVertical: 12, paddingHorizontal: 16 },
              titleStyle: { color: C.paper, fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 },
              descriptionStyle: { color: `${C.paper}B3`, fontFamily: FONT.regular, fontSize: 12, lineHeight: 16 },
              actionButtonStyle: { backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 4 },
              actionButtonTextStyle: { color: C.orange, fontFamily: FONT.semibold, fontSize: 13 },
            }}
          />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
