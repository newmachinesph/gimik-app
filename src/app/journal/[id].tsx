import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { toast } from 'sonner-native';

import { NotFound } from '@/components/not-found';
import { Card, Chip, Field, PrimaryButton, Screen, Section, SectionHead, TopBar, Txt } from '@/components/ui';
import { addJournal } from '@/lib/actions';
import { hasApi } from '@/lib/api/client';
import { loadJournal } from '@/lib/api/sync';
import { timestampDayLabel } from '@/lib/format';
import { wantTitle } from '@/lib/mock';
import { wantById } from '@/lib/somedays';
import { useApp } from '@/store';

/** A private memory: photo and a few lines, after. */
export default function Journal() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const want = wantById(id);
  const journal = useApp((s) => s.journal);
  const entries = useMemo(() => journal.filter((entry) => entry.wantId === id), [journal, id]);
  const doneAt = useApp((s) => (id ? s.doneAt[id] : undefined));
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (id && hasApi && useApp.getState().source === 'api') void loadJournal(id).catch(() => {}); }, [id]);
  if (!want || !id) return <NotFound />;

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };
  const save = async () => {
    if (saving) return;
    if (!body.trim() && !photo) return;
    setSaving(true);
    const saved = await addJournal({ wantId: id, body: body.trim(), photo: photo ?? undefined });
    setSaving(false);
    if (!saved) return;
    setBody('');
    setPhoto(null);
    toast(t('s.toasts.journalSaved'));
  };

  return (
    <Screen inset={false}>
      <TopBar title="" />
      <Txt variant="date">{doneAt ? t('s.journal.doneStamp', { date: timestampDayLabel(doneAt) }) : t('s.journal.stamp')}</Txt>
      <Txt variant="title" className="mt-1" numberOfLines={2}>{wantTitle(want)}</Txt>
      <Section className="mt-6">
        <SectionHead title={t('s.journal.how.title')} subtitle={t('s.journal.how.subtitle')} />
        {photo ? <View className="h-[180px] rounded-[4px] overflow-hidden mb-3"><Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" /></View> : null}
        <View className="flex-row gap-2 mb-3"><Chip label={photo ? t('s.journal.changePhoto') : t('s.journal.addPhoto')} selected={Boolean(photo)} onPress={() => void pick()} /></View>
        <Field placeholder={t('s.journal.ph')} value={body} onChangeText={setBody} multiline />
        <PrimaryButton label={t('s.journal.save')} icon="plus" disabled={saving || (!body.trim() && !photo)} state={saving ? 'loading' : 'idle'} onPress={save} />
      </Section>
      <Section>
        <SectionHead title={t('s.journal.entries')} subtitle={`${entries.length}`} />
        {entries.length ? entries.slice().reverse().map((entry) => (
          <Card key={entry.id} className="overflow-hidden mb-3">
            {entry.photo ? <View className="h-[160px]"><Image source={entry.photo} style={StyleSheet.absoluteFill} contentFit="cover" /></View> : null}
            <View className="p-4"><Txt variant="body" className="text-brand-ink">{entry.body}</Txt><Txt variant="date" className="mt-2">{timestampDayLabel(entry.at)}</Txt></View>
          </Card>
        )) : <Txt variant="caption">{t('s.journal.nothing')}</Txt>}
      </Section>
      <PrimaryButton label={t('s.journal.backToRecord')} onPress={() => router.replace('/(tabs)/profile' as never)} />
    </Screen>
  );
}
