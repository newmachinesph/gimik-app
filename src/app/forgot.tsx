import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { GhostButton, InlineNotice, PrimaryButton, Screen, Field, TopBar, Txt } from '@/components/ui';
import { auth } from '@/lib/api';

/**
 * Asking for a reset link.
 *
 * The confirmation is deliberately the same whether or not the address has an
 * account: anything else lets someone sort a list of emails into customers and
 * strangers by reading this screen.
 */
export default function Forgot() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await auth.forgotPassword(email);
    } catch {
      // Still reported as sent: a network failure must not become the tell.
    } finally {
      setBusy(false);
      setSent(true);
    }
  };

  return (
    <Screen
      inset={false}
      footer={
        sent ? (
          <PrimaryButton label={t('s.forgot.back')} onPress={() => router.replace('/sign-in' as never)} />
        ) : (
          <PrimaryButton
            label={t('s.forgot.action')}
            icon="arrow-right"
            disabled={!email.includes('@') || busy}
            state={busy ? 'loading' : 'idle'}
            onPress={() => void submit()}
          />
        )
      }
    >
      <TopBar title="" />
      <Txt variant="title">{t('s.forgot.title')}</Txt>
      <Txt variant="body" className="mt-2 mb-6">{t('s.forgot.body')}</Txt>

      {sent ? (
        <View>
          <InlineNotice tone="success" title={t('s.forgot.sentTitle')} body={t('s.forgot.sentBody')} />
          <View className="mt-4">
            <GhostButton label={t('s.reset.title')} tone="muted" onPress={() => router.replace('/reset' as never)} />
          </View>
        </View>
      ) : (
        <Field
          label={t('s.signIn.email')}
          placeholder={t('s.signIn.emailPh')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />
      )}
    </Screen>
  );
}
