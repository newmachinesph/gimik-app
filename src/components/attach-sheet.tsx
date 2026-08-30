import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PlaceField } from '@/components/place-field';
import { BottomSheet, Chip, PrimaryButton, Txt } from '@/components/ui';
import { formatDate } from '@/i18n/format';
import { wantTitle } from '@/lib/mock';
import { wantById } from '@/lib/somedays';
import { useApp, type Message } from '@/store';

type Attachment = NonNullable<Message['attachment']>;

/** The next few weekend days, as a person would say them. */
function weekendDays(count: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (out.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day === 6 || day === 0) {
      const iso = cursor.toISOString().slice(0, 10);
      const label = formatDate(cursor, { weekday: 'short', month: 'short', day: 'numeric' });
      out.push({ iso, label });
    }
  }
  return out;
}

/**
 * Attach a date, a someday, or a place to a message so "lock it" can happen
 * inside the conversation. One tab-less sheet: pick a thing, it sends.
 */
export function AttachSheet({ visible, onDismiss, onSend, pinnedWantId }: {
  visible: boolean;
  onDismiss: () => void;
  onSend: (body: string, attachment: Attachment) => void;
  pinnedWantId?: string;
}) {
  const { t } = useTranslation();
  const keptIds = useApp((s) => s.keptIds);
  const [place, setPlace] = useState('');
  const days = weekendDays(4);
  const somedays = [pinnedWantId, ...keptIds.filter((id) => id !== pinnedWantId)].filter(Boolean).slice(0, 6).map((id) => wantById(id!)).filter(Boolean);
  const send = (body: string, attachment: Attachment) => { onSend(body, attachment); setPlace(''); onDismiss(); };
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Txt variant="eyebrow">{t('s.attach.proposeDate')}</Txt>
      <View className="flex-row flex-wrap gap-2 mt-2">
        {days.map((day) => <Chip key={day.iso} label={day.label} onPress={() => send(t('s.attach.howAbout', { label: day.label }), { type: 'date', refId: day.iso, label: day.label })} />)}
      </View>
      <Txt variant="eyebrow" className="mt-6">{t('s.attach.shareSomeday')}</Txt>
      <View className="flex-row flex-wrap gap-2 mt-2">
        {somedays.map((want) => <Chip key={want!.id} label={wantTitle(want!)} onPress={() => send(t('s.attach.doTogether'), { type: 'someday', refId: want!.id, label: wantTitle(want!) })} />)}
        {!somedays.length ? <Txt variant="caption">{t('s.attach.keepFirst')}</Txt> : null}
      </View>
      <Txt variant="eyebrow" className="mt-6">{t('s.attach.aPlace')}</Txt>
      <View className="mt-2 mb-3"><PlaceField value={place} onChange={setPlace} /></View>
      <PrimaryButton label={t('s.attach.sendPlace')} disabled={!place.trim()} onPress={() => send(t('s.attach.meetAt', { place: place.trim() }), { type: 'place', refId: place.trim(), label: place.trim() })} />
    </BottomSheet>
  );
}
