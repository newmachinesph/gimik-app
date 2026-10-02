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
import { setTermsAgreed, termsAgreed } from '@/lib/terms';
import { C } from '@/lib/tokens';

/** The door. One photo, one line, one button - and the terms, agreed before either way in. */
export default function Welcome() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // App Store guideline 1.2: nobody registers or signs in without agreeing to
  // terms that rule out objectionable content and abusive users. Both ways in
  // start on this screen, and both check `termsAgreed` themselves, so a link
  // straight to either cannot skip it.
  const [agreed, setAgreed] = useState(termsAgreed);
  const toggle = () => { setTermsAgreed(!agreed); setAgreed(!agreed); };
  const signIn = () => router.push('/sign-in' as never);
  const open = (page: string) => { void WebBrowser.openBrowserAsync(`${SITE_URL}/${page}`); };
  const sentence = `${t('s.welcome.agree')} ${t('s.welcome.terms')} ${t('s.welcome.and')} ${t('s.welcome.privacy')}. ${t('s.welcome.noTolerance')}`;
  return (
    <View className="flex-1 bg-brand-night">
      <Image source={PHOTO.hero} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={StyleSheet.absoluteFill} className="bg-brand-night/50" />
      <View className="flex-1 justify-end px-6" style={{ paddingBottom: insets.bottom + 24 }}>
        <Txt variant="someday" style={{ color: C.paper }}>{t('s.welcome.someday')}</Txt>
        <Txt variant="display" className="text-brand-paper">{t('s.welcome.headline')}</Txt>
        <Txt variant="body" className="text-brand-paper/80 mt-3 mb-6">{t('s.welcome.body')}</Txt>
        {/* The box and the sentence are siblings, not one pressable: a screen
            reader has to be able to reach the two links on their own. */}
        <View className="flex-row items-start mb-5">
          <Pressable accessibilityRole="checkbox" accessibilityLabel={sentence} accessibilityState={{ checked: agreed }} onPress={toggle} hitSlop={12} className="mr-3 mt-[2px] active:opacity-70">
            <View className={`w-5 h-5 rounded-[4px] border items-center justify-center ${agreed ? 'bg-brand-paper border-brand-paper' : 'border-brand-paper'}`}>
              {agreed ? <View className="w-2 h-2 rounded-[1px] bg-brand-night" /> : null}
            </View>
          </Pressable>
          <Txt variant="caption" className="flex-1 text-brand-paper" onPress={toggle}>
            {t('s.welcome.agree')}{' '}
            <Txt variant="caption" accessibilityRole="link" className="text-brand-paper underline" onPress={() => open('terms')}>{t('s.welcome.terms')}</Txt>
            {' '}{t('s.welcome.and')}{' '}
            <Txt variant="caption" accessibilityRole="link" className="text-brand-paper underline" onPress={() => open('privacy')}>{t('s.welcome.privacy')}</Txt>
            {'. '}{t('s.welcome.noTolerance')}
          </Txt>
        </View>
        <PrimaryButton label={t('s.welcome.start')} icon="arrow-right" disabled={!agreed} onPress={() => router.push('/onboarding' as never)} />
        <View className="-mt-3"><GhostButton label={t('s.welcome.haveAccount')} tone="white" disabled={!agreed} onPress={signIn} /></View>
      </View>
    </View>
  );
}
