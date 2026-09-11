import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import { toast } from 'sonner-native';

import {
  GhostButton,
  NavRow,
  PrimaryButton,
  RowList,
  Screen,
  Section,
  SectionHead,
  TopBar,
  Txt,
} from '@/components/ui';
import { NotFound } from '@/components/not-found';
import { openThread } from '@/lib/actions';
import { useApp } from '@/store';

/** One group: who is in it, its thread, and the link that lets anyone join. */
export default function GroupDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useApp((s) => s.groups.find((item) => item.id === id));
  const threads = useApp((s) => s.threads);
  const leave = useApp((s) => s.leaveGroup);
  if (!group) return <NotFound />;
  const thread = threads.find((item) => item.kind === 'group' && item.refId === group.id);
  const share = () => void Share.share({ message: t('s.groups.detail.shareMessage', { name: group.name, url: `https://gimik.app/join/${group.inviteToken}` }) });

  return (
    <Screen inset={false} footer={<PrimaryButton label={t('s.groups.detail.share')} icon="arrow-right" onPress={share} />}>
      <TopBar title="" />
      <Txt variant="eyebrow">{t('s.groups.detail.eyebrow')}</Txt>
      <Txt variant="title" className="mt-1">{group.name}</Txt>
      <Txt variant="body" className="mt-1">{t('s.groups.detail.body')}</Txt>

      <Section className="mt-6">
        <SectionHead title={t('s.groups.detail.members')} subtitle={`${group.members.length}`} />
        <RowList>
          {group.members.map((name) => {
            const isMe = name === 'me';
            const label = isMe ? t('s.common.you') : name;
            return (
              <NavRow
                key={name}
                avatar={label}
                title={label}
                chevron={!isMe}
                onPress={isMe ? undefined : () => router.push(`/person/${encodeURIComponent(name)}` as never)}
              />
            );
          })}
        </RowList>
      </Section>

      <Section>
        <RowList>
          <NavRow
            icon="chat"
            title={t('s.groups.detail.thread')}
            size="lg"
            onPress={() => {
              const th = thread ?? openThread('group', group.id, group.name);
              router.push(`/messages/${th.id}` as never);
            }}
          />
        </RowList>
      </Section>

      <GhostButton label={t('s.groups.detail.leave')} tone="muted" onPress={() => { leave(group.id); toast(t('s.toasts.groupLeft', { name: group.name })); router.back(); }} />
    </Screen>
  );
}
