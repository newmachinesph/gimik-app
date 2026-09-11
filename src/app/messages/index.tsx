import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, GimikIcon, NavRow, RowList, Screen, TopBar } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { isThreadUnread, useInboxThreads } from '@/lib/threads';
import { C } from '@/lib/tokens';

/** Every thread - solo, group, plan - newest message first. */
export default function Inbox() {
  const { t } = useTranslation();
  const rows = useInboxThreads();

  return (
    <Screen inset={false}>
      <TopBar title={t('s.messages.title')} />
      {rows.length ? (
        <RowList>
          {rows.map((thread) => {
            const last = thread.messages.at(-1);
            const unread = isThreadUnread(thread);
            // A thread where only you have spoken says so, quietly. An invite
            // expires on its own; a conversation is allowed to simply wait.
            const awaitingReply = Boolean(last && thread.kind === 'solo' && thread.messages.every((message) => message.from === 'me'));
            const preview = last
              ? awaitingReply
                ? t('s.messages.noReply')
                : `${last.from === 'me' ? t('s.messages.youPrefix') : ''}${last.body}`
              : thread.kind === 'plan'
                ? t('s.messages.planThread')
                : t('s.messages.sayHi');

            return (
              <NavRow
                key={thread.id}
                size="lg"
                avatar={thread.kind === 'solo' ? thread.title : undefined}
                leading={thread.kind === 'solo' ? undefined : (
                  <View className="w-11 h-11 rounded-full bg-brand-paper-sunk items-center justify-center">
                    <GimikIcon name={thread.kind === 'plan' ? 'calendar' : 'people'} size={20} color={C.ink} />
                  </View>
                )}
                title={thread.title}
                meta={last ? timeAgo(last.at) : undefined}
                caption={preview}
                emphasis={unread}
                chevron={false}
                trailing={unread ? <View className="w-2 h-2 rounded-full bg-brand-orange" /> : undefined}
                onPress={() => router.push(`/messages/${thread.id}` as never)}
              />
            );
          })}
        </RowList>
      ) : (
        <EmptyState icon="chat" title={t('s.messages.empty.title')} body={t('s.messages.empty.body')} />
      )}
    </Screen>
  );
}
