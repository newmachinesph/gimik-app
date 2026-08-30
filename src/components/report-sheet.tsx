import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet, Chip, GhostButton, GoraIcon, PrimaryButton, Txt } from '@/components/ui';
import { C } from '@/lib/tokens';

const REASONS = ['fake', 'rude', 'notThem', 'spam', 'other'] as const;

/**
 * Report a person. Quiet, quick, and never shown to them.
 *
 * `onSend` is required rather than optional: this sheet used to flip straight
 * to its thank-you state, so the app told people their report had been
 * received while sending it nowhere. Making the caller supply the send is what
 * stops that happening again.
 */
export function ReportSheet({ name, visible, onDismiss, onHide, onSend }: { name: string; visible: boolean; onDismiss: () => void; onHide: () => void; onSend: (reason: string) => void }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const first = name.split(' ')[0];
  const close = () => { onDismiss(); setTimeout(() => { setSent(false); setReason(null); }, 300); };
  return (
    <BottomSheet visible={visible} onDismiss={close}>
      {sent ? (
        <View className="items-center py-4">
          <View className="w-14 h-14 rounded-full bg-brand-paper-sunk items-center justify-center"><GoraIcon name="success" size={26} color={C.ink} weight="fill" /></View>
          <Txt variant="heading" className="mt-4">{t('s.report.thanksTitle')}</Txt>
          <Txt variant="body" className="mt-2 text-center">{t('s.report.thanksBody', { name: first })}</Txt>
          <View className="mt-5 w-full"><PrimaryButton label={t('s.report.hideToo', { name: first })} onPress={onHide} /></View>
          <GhostButton label={t('s.common.done')} tone="muted" onPress={close} />
        </View>
      ) : (
        <View>
          <Txt variant="eyebrow">{t('s.report.eyebrow')}</Txt>
          <Txt variant="title" className="mt-1">{t('s.report.title', { name: first })}</Txt>
          <View className="flex-row flex-wrap gap-2 mt-5">
            {REASONS.map((item) => <Chip key={item} label={t(`s.report.reasons.${item}`)} selected={reason === item} onPress={() => setReason(item)} />)}
          </View>
          <View className="mt-6"><PrimaryButton label={t('s.report.send')} disabled={!reason} onPress={() => { if (!reason) return; onSend(reason); setSent(true); }} /></View>
          <GhostButton label={t('s.common.cancel')} tone="muted" onPress={close} />
        </View>
      )}
    </BottomSheet>
  );
}
