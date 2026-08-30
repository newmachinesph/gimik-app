import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Field, InlineNotice, PrimaryButton, Screen, TopBar, Txt } from '@/components/ui';
import { ApiError, NetworkError, auth, setTokens } from '@/lib/api';
import { hydrateFromApi } from '@/lib/api/sync';

/**
 * Setting a new password.
 *
 * Reached two ways: the `gora://reset?token=...` deep link in the email, or by
 * pasting the code by hand. The second exists because a deep link that does
 * not fire - a desktop inbox, a stripped scheme - should not strand someone
 * who is locked out.
 *
 * Succeeding signs them in, because asking for a password twice in a row is a
 * poor reward for having just proved they own the inbox.
 */
export default function Reset() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const pair = await auth.resetPassword(token.trim(), password);
      await setTokens(pair);
      await hydrateFromApi();
      router.replace('/(tabs)/home' as never);
    } catch (cause) {
      if (cause instanceof ApiError) setError(t('s.reset.expired'));
      else if (cause instanceof NetworkError) setError(t('s.signIn.offlineBody'));
      else setError(t('s.reset.expired'));
      setBusy(false);
    }
  };

  return (
    <Screen
      inset={false}
      footer={
        <PrimaryButton
          label={t('s.reset.action')}
          icon="arrow-right"
          disabled={token.trim().length < 10 || password.length < 8 || busy}
          state={busy ? 'loading' : 'idle'}
          onPress={() => void submit()}
        />
      }
    >
      <TopBar title="" />
      <Txt variant="title">{t('s.reset.title')}</Txt>
      <Txt variant="body" className="mt-2 mb-6">{t('s.reset.body')}</Txt>

      {error ? (
        <View className="mb-4">
          <InlineNotice tone="error" title={t('s.reset.failedTitle')} body={error} />
        </View>
      ) : null}

      {/* Pre-filled and hidden when the deep link carried it; shown when it did not. */}
      {params.token ? null : (
        <Field
          label={t('s.reset.code')}
          placeholder={t('s.reset.codePh')}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          editable={!busy}
        />
      )}
      <Field
        label={t('s.reset.password')}
        placeholder={t('s.reset.passwordPh')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
      />
    </Screen>
  );
}
