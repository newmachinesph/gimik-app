import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton, Txt } from '@/components/ui';
import { PHOTO } from '@/lib/photos';
import { C } from '@/lib/tokens';

/** The door. One photo, one line, one button. */
export default function Welcome() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const signIn = () => router.push('/sign-in' as never);
  return (
    <View className="flex-1 bg-brand-night">
      <Image source={PHOTO.hero} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={StyleSheet.absoluteFill} className="bg-brand-night/50" />
      <View className="flex-1 justify-end px-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <Txt variant="someday" style={{ color: C.paper }}>{t('s.welcome.someday')}</Txt>
        <Txt variant="display" className="text-brand-paper">{t('s.welcome.headline')}</Txt>
        <Txt variant="body" className="text-brand-paper/80 mt-3 mb-8">{t('s.welcome.body')}</Txt>
        <PrimaryButton label={t('s.welcome.start')} icon="arrow-right" onPress={() => router.push('/onboarding' as never)} />
        <View className="mt-2"><GhostButton label={t('s.welcome.haveAccount')} tone="white" onPress={signIn} /></View>
      </View>
    </View>
  );
}
