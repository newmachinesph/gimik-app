import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';

import { InviteRow } from '@/components/invite-row';
import { InviteSheet } from '@/components/invite-sheet';
import {
  EmptyState,
  IconButton,
  ROW_LIST_GUTTER,
  RowList,
  Screen,
  ScreenHeader,
  Section,
  SectionHead,
  SwipeRow,
  Txt,
} from '@/components/ui';
import { acceptInvite, declineInvite, hidePerson, markInvitesSeen as markSeen, unhidePerson } from '@/lib/actions';
import { INVITE_URGENT_WITHIN_HOURS, useLiveInvites, type InviteRowData } from '@/lib/invites';
import { useUnreadThreads } from '@/lib/threads';

/**
 * Who wants to do this with me? Newest first.
 *
 * Tapping a row opens the invite rather than accepting it: accepting starts a
 * thread with someone who may be a stranger, and that is not a thing to do by
 * brushing a list. The two quiet noes are on the swipe, where a decision you
 * have already made costs one gesture.
 */
export default function Invites() {
  const { t } = useTranslation();
  const rows = useLiveInvites();
  const unread = useUnreadThreads();
  const [open, setOpen] = useState<InviteRowData | null>(null);
  const close = () => setOpen(null);

  // A beat before marking them seen, so opening the tab and leaving straight
  // away does not silently clear the badge.
  useEffect(() => {
    const timer = setTimeout(markSeen, 1500);
    return () => clearTimeout(timer);
  }, []);

  const notNow = (row: InviteRowData) => {
    declineInvite(row.invite.id);
    toast(t('s.toasts.inviteNotNow'));
  };
  const hide = (row: InviteRowData) => {
    const name = row.person.name;
    const first = name.split(' ')[0];
    hidePerson(name);
    toast(t('s.toasts.hidden', { name: first }), {
      action: { label: t('s.common.undo'), onClick: () => { unhidePerson(name); toast(t('s.toasts.unhidden', { name: first })); } },
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('s.invites.title')}
        subtitle={t('s.invites.subtitle')}
        right={<IconButton icon="chat" label={unread ? t('s.invites.messagesUnread', { count: unread }) : t('s.invites.messages')} onPress={() => router.push('/messages' as never)} />}
      />
      {rows.length ? (
        <Section className="mt-2">
          <SectionHead title={t('s.invites.waiting')} subtitle={t('s.invites.count', { count: rows.length })} />
          <RowList>
            {rows.map((row) => (
              <SwipeRow
                key={row.invite.id}
                gutter={ROW_LIST_GUTTER}
                closeLabel={t('s.common.close')}
                actions={[
                  { label: t('s.invites.notNow'), icon: 'close', onPress: () => notNow(row) },
                  { label: t('s.invites.hide'), icon: 'warning', tone: 'danger', onPress: () => hide(row) },
                ]}
              >
                <InviteRow
                  want={row.want}
                  person={row.person}
                  party={row.invite.party}
                  // Only the last two days say so. Before that the invite just waits.
                  note={row.hoursLeft <= INVITE_URGENT_WITHIN_HOURS ? t('s.invites.expiring', { count: row.hoursLeft }) : undefined}
                  onPress={() => setOpen(row)}
                />
              </SwipeRow>
            ))}
          </RowList>
          <Txt variant="caption" className="mt-3">{t('s.invites.expiryNote')}</Txt>
        </Section>
      ) : (
        <EmptyState icon="heart" title={t('s.invites.empty.title')} body={t('s.invites.empty.body')} action={t('s.invites.empty.action')} onAction={() => router.push('/(tabs)/home' as never)} />
      )}
      <InviteSheet
        row={open ? { want: open.want, person: open.person, party: open.invite.party } : null}
        onDismiss={close}
        onNotNow={() => { if (open) notNow(open); close(); }}
        onHide={() => { if (open) hide(open); close(); }}
        onAccept={async () => {
          if (!open) return;
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const thread = await acceptInvite(open.invite.id);
          if (!thread) return;
          close();
          toast(t('s.toasts.inviteAccepted'));
          router.push(`/messages/${thread.id}` as never);
        }}
      />
    </Screen>
  );
}
