import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Field,
  GhostButton,
  InlineNotice,
  LoadingState,
  PrimaryButton,
  Screen,
  TopBar,
  Txt,
} from '@/components/ui';
import { ApiError, NetworkError } from '@/lib/api';
import { hasApi, signIn } from '@/lib/api/session';
import { DEMO } from '@/data/demo';
import { useApp } from '@/store';

/** The way back in for an account that already exists. */
export default function SignIn() {
  const { t } = useTranslation();
  const loadDemo = useApp((state) => state.loadDemo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = email.includes('@') && password.length >= 8;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/(tabs)/home' as never);
    } catch (cause) {
      // Two failures worth telling apart: the server said no, or it never
      // answered. They call for different next actions from the person.
      if (cause instanceof ApiError) setError(t('s.signIn.badCredentials'));
      else if (cause instanceof NetworkError) setError(t('s.signIn.offlineBody'));
      else setError(t('s.signIn.offlineBody'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      inset={false}
      footer={
        <PrimaryButton
          label={t('s.signIn.action')}
          icon="arrow-right"
          disabled={!valid || busy || !hasApi}
          state={busy ? 'loading' : 'idle'}
          onPress={() => void submit()}
        />
      }
    >
      <TopBar title="" />
      <Txt variant="title">{t('s.signIn.title')}</Txt>
      <Txt variant="body" className="mt-2 mb-6">{t('s.signIn.body')}</Txt>

      {!hasApi ? (
        <View className="mb-4">
          <InlineNotice tone="info" title={t('s.signIn.offlineTitle')} body={t('s.signIn.noServer')} />
        </View>
      ) : null}
      {error ? (
        <View className="mb-4">
          <InlineNotice tone="error" title={t('s.signIn.failedTitle')} body={error} />
        </View>
      ) : null}

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
      <Field
        label={t('s.signIn.password')}
        placeholder={t('s.signIn.passwordPh')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
      />
      {busy ? <LoadingState label={t('s.signIn.working')} /> : null}

      <View className="mt-2">
        <GhostButton label={t('s.signIn.forgot')} tone="muted" onPress={() => router.push('/forgot' as never)} />
      </View>

      {__DEV__ ? (
        <View className="mt-6">
          <GhostButton
            label={t('s.signIn.demo')}
            tone="muted"
            onPress={() => {
              loadDemo('week-in', DEMO['week-in']());
              router.replace('/(tabs)/home' as never);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
