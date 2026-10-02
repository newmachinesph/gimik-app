import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton, Txt } from '@/components/ui';
import { SITE_URL } from '@/lib/links';
import { PHOTO } from '@/lib/photos';
import { C } from '@/lib/tokens';

/** The door. One photo, one line, one button - and the terms, agreed before either way in. */
export default function Welcome() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // App Store guideline 1.2: nobody registers or signs in without agreeing to
  // terms that rule out objectionable content and abusive users. Both ways in
  // start on this screen, so one checkbox here gates them both.
  const [agreed, setAgreed] = useState(false);
  const signIn = () => router.push('/sign-in' as never);
  const open = (page: string) => { void WebBrowser.openBrowserAsync(`${SITE_URL}/${page}`); };
  return (
    <View className="flex-1 bg-brand-night">
      <Image source={PHOTO.hero} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={StyleSheet.absoluteFill} className="bg-brand-night/50" />
      <View className="flex-1 justify-end px-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <Txt variant="someday" style={{ color: C.paper }}>{t('s.welcome.someday')}</Txt>
        <Txt variant="display" className="text-brand-paper">{t('s.welcome.headline')}</Txt>
        <Txt variant="body" className="text-brand-paper/80 mt-3 mb-6">{t('s.welcome.body')}</Txt>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed((value) => !value)} className="flex-row items-start mb-5 active:opacity-70">
          <View className={`w-5 h-5 rounded-[4px] border mr-3 mt-[2px] items-center justify-center ${agreed ? 'bg-brand-paper border-brand-paper' : 'border-brand-paper'}`}>
            {agreed ? <View className="w-2 h-2 rounded-[1px] bg-brand-night" /> : null}
          </View>
          <Txt variant="caption" className="flex-1 text-brand-paper">
            {t('s.welcome.agree')}{' '}
            <Txt variant="caption" accessibilityRole="link" className="text-brand-paper underline" onPress={() => open('terms')}>{t('s.welcome.terms')}</Txt>
            {' '}{t('s.welcome.and')}{' '}
            <Txt variant="caption" accessibilityRole="link" className="text-brand-paper underline" onPress={() => open('privacy')}>{t('s.welcome.privacy')}</Txt>
            {'. '}{t('s.welcome.noTolerance')}
          </Txt>
        </Pressable>
        <PrimaryButton label={t('s.welcome.start')} icon="arrow-right" disabled={!agreed} onPress={() => router.push('/onboarding' as never)} />
        <View className="-mt-3"><GhostButton label={t('s.welcome.haveAccount')} tone="white" disabled={!agreed} onPress={signIn} /></View>
      </View>
    </View>
  );
}
