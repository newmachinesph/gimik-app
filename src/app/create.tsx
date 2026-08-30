import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Card, Field, PrimaryButton, Screen, TopBar, Txt } from '@/components/ui';
import { keep, unkeep } from '@/lib/actions';
import { WANTS, wantTitle } from '@/lib/mock';

/** Type a sentence; the catalog matches it; you keep the one you meant. */
export default function Create() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const matches = useMemo(() => {
    const needle = text.trim().toLowerCase();
    if (needle.length < 3) return [];
    return WANTS.filter((want) => wantTitle(want).toLowerCase().includes(needle)).slice(0, 5);
  }, [text]);
  return (
    <Screen inset={false}>
      <TopBar title="" />
      <Txt variant="eyebrow">{t('s.create.eyebrow')}</Txt>
      <Txt variant="title" className="mt-1">{t('s.create.title')}</Txt>
      <Txt variant="body" className="mt-2 mb-6">{t('s.create.body')}</Txt>
      <Field placeholder={t('s.create.ph')} value={text} onChangeText={setText} autoFocus />
      {matches.length ? (
        <Card className="px-4 mb-4">
          {matches.map((want) => (
            <View key={want.id} className="py-3 border-b border-brand-rule">
              <PrimaryButton
                label={t('s.create.keepQuoted', { title: wantTitle(want) })}
                onPress={() => {
                  keep(want.id);
                  toast(t('s.toasts.kept', { title: wantTitle(want) }), { action: { label: t('s.common.undo'), onClick: () => unkeep(want.id) } });
                  router.back();
                }}
              />
            </View>
          ))}
        </Card>
      ) : text.trim().length >= 3 ? (
        <Txt variant="caption">{t('s.create.noMatch')}</Txt>
      ) : null}
    </Screen>
  );
}
