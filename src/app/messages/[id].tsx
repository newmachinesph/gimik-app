import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { NotFound } from '@/components/not-found';
import { AttachSheet } from '@/components/attach-sheet';
import { ReportSheet } from '@/components/report-sheet';
import { Avatar, FocusablePressable, GimikIcon, ICON_BUTTON_INSET, ICON_BUTTON_SIZE, IconButton, Txt } from '@/components/ui';
import { hidePerson, markThreadRead as markRead, reportPerson, sendMessage as send } from '@/lib/actions';
import { hasApi } from '@/lib/api/client';
import { loadThread } from '@/lib/api/sync';
import { dayLabel, timeAgo } from '@/lib/format';
import { wantTitle } from '@/lib/mock';
import { wantById } from '@/lib/somedays';
import { C } from '@/lib/tokens';
import { useApp, type Message } from '@/store';

/** A date, a someday, or a place inside a bubble. Dates can be locked from here. */
function AttachmentCard({ attachment, mine, wantId, withName }: { attachment: NonNullable<Message['attachment']>; mine: boolean; wantId?: string; withName?: string }) {
  const { t } = useTranslation();
  const icon = attachment.type === 'date' ? 'calendar' : attachment.type === 'place' ? 'map' : 'heart';
  const open = () => {
    if (attachment.type === 'someday') router.push(`/want/${attachment.refId}` as never);
    else if (attachment.type === 'date' && wantId) router.push(`/lock/${wantId}?date=${attachment.refId}${withName ? `&with=${encodeURIComponent(withName)}` : ''}` as never);
  };
  const actionable = attachment.type === 'someday' || (attachment.type === 'date' && Boolean(wantId));
  return (
    <FocusablePressable accessibilityRole="button" disabled={!actionable} onPress={open} className={`mt-2 flex-row items-center px-3 py-2 rounded-[4px] border ${mine ? 'border-brand-paper/30' : 'border-brand-rule bg-brand-paper'}`}>
      <GimikIcon name={icon} size={16} color={mine ? C.paper : C.ink} weight="fill" />
      <View className="flex-1 ml-2">
        <Txt variant="caption" className={mine ? 'text-brand-paper/70' : ''}>{t(`s.messages.attachment.${attachment.type}`)}</Txt>
        <Txt variant="label" className={mine ? 'text-brand-paper' : 'text-brand-ink'} numberOfLines={1}>{attachment.label}</Txt>
      </View>
      {actionable ? <Txt variant="caption" className={mine ? 'text-brand-paper' : 'text-brand-ink'}>{attachment.type === 'date' ? t('s.messages.attachment.lockIt') : t('s.messages.attachment.open')}</Txt> : null}
    </FocusablePressable>
  );
}

/** One thread. Its someday stays pinned at the top: a plan, or the invite that started it. */
export default function ThreadScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const thread = useApp((s) => s.threads.find((item) => item.id === id));
  const plan = useApp((s) => (thread?.kind === 'plan' ? s.plans[thread.refId] : undefined));
  const [draft, setDraft] = useState('');
  const [attaching, setAttaching] = useState(false);
  // Who is being reported: the other person from the header, or whoever wrote
  // the message that was long-pressed. Kept apart from `reporting` so the name
  // is still there while the sheet animates shut.
  const [reportee, setReportee] = useState('');
  const [reporting, setReporting] = useState(false);
  const report = (name: string) => { setReportee(name); setReporting(true); };
  const list = useRef<ScrollView>(null);
  const historyHead = thread?.messages[0]?.id;
  useEffect(() => { if (id && hasApi && useApp.getState().source === 'api') void loadThread(id).catch(() => {}); }, [id, historyHead]);
  useEffect(() => { if (id) markRead(id); }, [id, thread?.messages.length]);
  // A thread that was here and is gone was closed by a block - from this
  // screen or from the profile opened over it. Leave, rather than sit on a
  // "not here" page for a conversation that was on screen a moment ago.
  const [seen, setSeen] = useState(Boolean(thread));
  if (thread && !seen) setSeen(true);
  const closed = seen && !thread;
  useEffect(() => { if (closed && router.canGoBack()) router.back(); }, [closed]);
  if (closed) return <View className="flex-1 bg-brand-paper" />;
  if (!thread || !id) return <NotFound />;
  const pinnedId = thread.kind === 'plan' ? thread.refId : thread.wantId;
  const want = pinnedId ? wantById(pinnedId) : undefined;
  const withName = thread.kind === 'solo' ? thread.refId : undefined;

  const submit = () => { const body = draft.trim(); if (!body) return; send(id, body); setDraft(''); setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50); };
  const openPinned = () => { if (!want) return; router.push((plan ? `/plan/${want.id}` : `/want/${want.id}`) as never); };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top }}>
      <View className="flex-row items-center px-3 pb-2 border-b border-brand-rule">
        <IconButton icon="back" label={t('s.common.back')} onPress={() => router.back()} />
        {thread.kind === 'solo' ? (
          // Sized to the back control's circle: a smaller avatar beside it read
          // as an afterthought rather than as the subject of the screen.
          <FocusablePressable
            accessibilityRole="button"
            accessibilityLabel={t('s.messages.view', { name: thread.title })}
            onPress={() => router.push(`/person/${encodeURIComponent(thread.title)}` as never)}
            className="ml-2 active:opacity-70"
          >
            <Avatar name={thread.title} size={ICON_BUTTON_SIZE} />
          </FocusablePressable>
        ) : null}
        <View className="flex-1 ml-3 min-w-0">
          {/* Heading over caption: at label size the name and the kind were a
              single point apart and the header read as two equal lines. */}
          <Txt variant="heading" className="text-brand-ink" numberOfLines={1}>{thread.title}</Txt>
          <Txt variant="caption" className="mt-[1px]">
            {thread.kind === 'solo' ? t('s.messages.solo') : thread.kind === 'group' ? t('s.messages.group') : t('s.messages.plan')}
          </Txt>
        </View>
        {withName ? <IconButton icon="warning" label={t('s.messages.report', { name: withName.split(' ')[0] })} onPress={() => report(withName)} /> : null}
      </View>
      {want ? (
        <FocusablePressable accessibilityRole="button" onPress={openPinned} className={`mx-4 mt-3 px-4 py-3 rounded-[4px] flex-row items-center active:opacity-80 ${plan ? 'bg-brand-night' : 'bg-brand-paper-sunk'}`}>
          <GimikIcon name={plan ? 'calendar' : 'heart'} size={18} color={plan ? C.paper : C.ink} weight="fill" />
          <View className="flex-1 ml-3">
            <Txt variant="label" className={plan ? 'text-brand-paper' : 'text-brand-ink'} numberOfLines={1}>{wantTitle(want)}</Txt>
            <Txt variant="caption" className={plan ? 'text-brand-paper/70' : ''}>{plan ? `${dayLabel(plan.date)}${plan.time ? ` · ${plan.time}` : ''}` : t('s.messages.noDate')}</Txt>
          </View>
          <GimikIcon name="chevron-right" size={16} color={plan ? C.paper : C.inkMuted} />
        </FocusablePressable>
      ) : null}
      <ScrollView ref={list} className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 16, gap: 8 }} onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}>
        {thread.messages.length ? thread.messages.map((message) => {
          const mine = message.from === 'me';
          return (
            <View key={message.id} className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
              {!mine && thread.kind !== 'solo' ? <Txt variant="caption" className="mb-1 ml-1">{message.from}</Txt> : null}
              {/* Hold someone else's message to report it: in a group there is
                  no single person in the header to report instead. */}
              <Pressable disabled={mine} onLongPress={() => report(message.from)} accessibilityHint={mine ? undefined : t('s.messages.holdToReport')} className={`px-3 py-2 rounded-[4px] ${mine ? 'bg-brand-night' : 'bg-brand-paper-sunk'}`}>
                <Txt variant="body" className={mine ? 'text-brand-paper' : 'text-brand-ink'}>{message.body}</Txt>
                {message.attachment ? <AttachmentCard attachment={message.attachment} mine={mine} wantId={pinnedId} withName={withName} /> : null}
              </Pressable>
              <Txt variant="caption" className={`mt-1 ${mine ? 'text-right' : ''}`}>{timeAgo(message.at)}</Txt>
            </View>
          );
        }) : <Txt variant="caption" className="text-center mt-10">{t('s.messages.sayHiLong')}</Txt>}
      </ScrollView>
      <View className="flex-row items-end px-3 pt-2 border-t border-brand-rule" style={{ paddingBottom: (keyboardVisible ? 0 : insets.bottom) + 8 }}>
        <IconButton icon="plus" label={t('s.messages.attach')} onPress={() => setAttaching(true)} />
        {/* The field is sized and offset to the buttons' *circles*, not to the
            boxes they sit in: an IconButton insets its circle by 4px on every
            side, so a bare `items-end` field ended up 8px shorter and 4px
            lower than the controls either side of it. It still grows upward
            for a long message, which is why the row aligns to the bottom. */}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('s.messages.msgPh')}
          placeholderTextColor={C.inkMuted}
          multiline
          className="flex-1 max-h-32 rounded-[4px] bg-brand-paper-sunk px-3 mx-2 text-brand-ink"
          style={{
            fontSize: 15,
            lineHeight: 20,
            minHeight: ICON_BUTTON_SIZE,
            marginBottom: ICON_BUTTON_INSET,
            paddingTop: 11,
            paddingBottom: 11,
            textAlignVertical: 'top',
          }}
          onSubmitEditing={submit}
        />
        <IconButton icon="send" label={t('s.messages.send')} tone="light" onPress={submit} />
      </View>
      <ReportSheet
        name={reportee}
        visible={reporting}
        onDismiss={() => setReporting(false)}
        onSend={(reason) => reportPerson(reportee, reason)}
        onHide={() => {
          setReporting(false);
          // Blocking takes a solo thread out of the store, and the screen
          // leaves by itself when its thread goes (see `closed` above).
          hidePerson(reportee);
          toast(t('s.toasts.hidden', { name: reportee.split(' ')[0] }));
        }}
      />
      <AttachSheet visible={attaching} onDismiss={() => setAttaching(false)} pinnedWantId={pinnedId} onSend={(body, attachment) => { send(id, body, attachment); setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80); }} />
    </KeyboardAvoidingView>
  );
}
