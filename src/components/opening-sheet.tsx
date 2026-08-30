import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, AppState, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoraIcon, NavRow, SecondaryButton, Txt } from '@/components/ui';
import { dayLabel } from '@/lib/format';
import { isInviteLive } from '@/lib/invites';
import { wantTitle } from '@/lib/mock';
import { WANT_BY_ID } from '@/lib/somedays';
import { PERSON_BY_NAME, genderMark } from '@/lib/people';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

const SLIDE_MS = 320;
/** Long enough for a stack transition to finish committing. */
const TRANSITION_SETTLE_MS = 450;
const MAX_ROWS = 4;

type News = { key: string; kind: 'invite' | 'request' | 'thread' | 'plan'; title: string; line: string; person?: string; href: string };

/**
 * What is new since you last looked, the moment the app comes back: invites,
 * friend requests, unread threads, a plan within a day. Shown once per item.
 */
export function OpeningSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const onboarded = useApp((state) => state.onboarded);
  const invites = useApp((state) => state.invites);
  const requests = useApp((state) => state.requests);
  const threads = useApp((state) => state.threads);
  const plans = useApp((state) => state.plans);
  const seen = useApp((state) => state.seenNewsKeys);
  const markSeen = useApp((state) => state.markNewsSeen);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [shown, setShown] = useState<News[]>([]);
  const [slide] = useState(() => new Animated.Value(1));

  const fresh = useMemo<News[]>(() => {
    const items: News[] = [];
    for (const invite of invites) {
      if (invite.status !== 'new' || !isInviteLive(invite)) continue;
      const person = PERSON_BY_NAME.get(invite.from);
      const want = WANT_BY_ID.get(invite.wantId);
      if (!person || !want) continue;
      items.push({
        key: `invite:${invite.id}`, kind: 'invite', person: person.name,
        title: wantTitle(want),
        line: `${person.name} ${genderMark(person.gender)} · ${invite.party === 'duo' ? t('s.common.duo') : t('s.common.group')} · ${person.city}`,
        href: '/(tabs)/invites',
      });
    }
    for (const request of requests) {
      const person = PERSON_BY_NAME.get(request.from);
      if (!person) continue;
      items.push({ key: `request:${request.from}`, kind: 'request', person: person.name, title: t('s.opening.wantsFriends', { name: person.name }), line: `${person.city}`, href: '/friends' });
    }
    for (const thread of threads) {
      const last = thread.messages.at(-1);
      if (!last || last.from === 'me' || (thread.readAt && thread.readAt > last.at)) continue;
      items.push({ key: `thread:${thread.id}:${last.id}`, kind: 'thread', person: last.from, title: thread.title, line: last.body, href: `/messages/${thread.id}` });
    }
    // eslint-disable-next-line react-hooks/purity -- "within 24h" needs the clock
    const soon = new Date(Date.now() + 24 * 3_600_000).toISOString().slice(0, 10);
    for (const plan of Object.values(plans)) {
      const want = WANT_BY_ID.get(plan.wantId);
      if (!want || plan.date > soon) continue;
      items.push({ key: `plan:${plan.wantId}:${plan.date}`, kind: 'plan', title: wantTitle(want), line: t('s.opening.locked', { date: `${dayLabel(plan.date)}${plan.time ? ` · ${plan.time}` : ''}` }), href: `/plan/${plan.wantId}` });
    }
    return items.filter((item) => !seen.includes(item.key));
  }, [invites, plans, requests, seen, t, threads]);

  const freshRef = useRef(fresh);
  useEffect(() => {
    freshRef.current = fresh;
  });

  useEffect(() => {
    if (!onboarded) return;
    const present = () => {
      const next = freshRef.current;
      if (!next.length) return;
      setShown(next);
      setSession((current) => current + 1);
      setOpen(true);
    };
    // Not during the navigation that brought us here. Mounting a Modal while
    // the router is still swapping trees makes Fabric mount a view the outgoing
    // surface has not finished releasing, and the app dies with "child already
    // has a parent". A beat longer than the stack transition removes the whole
    // class of crash, and nobody can perceive the delay on a sheet that is
    // announcing news. (InteractionManager would say this better and is
    // deprecated; a timeout is the boring replacement.)
    const timer = setTimeout(present, TRANSITION_SETTLE_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') present();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [onboarded]);

  useEffect(() => {
    if (open) slide.setValue(1);
    Animated.timing(slide, { toValue: open ? 0 : 1, duration: SLIDE_MS, useNativeDriver: true }).start();
  }, [open, session, slide]);

  const dismiss = () => {
    markSeen(shown.map((item) => item.key));
    setOpen(false);
  };
  const go = (href: string) => {
    dismiss();
    router.push(href as never);
  };

  if (!open) return null;
  const rows = shown.slice(0, MAX_ROWS);
  const more = shown.length - rows.length;

  return (
    <Modal key={session} transparent animationType="fade" visible statusBarTranslucent onRequestClose={dismiss}>
      <Pressable accessibilityLabel={t('s.common.close')} onPress={dismiss} style={{ flex: 1, backgroundColor: `${C.night}99` }} />
      <Animated.View
        style={{ transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }], paddingBottom: insets.bottom + 16 }}
        className="bg-brand-paper rounded-t-[4px] px-5 pt-3"
      >
        <View className="self-center w-10 h-1 rounded-full bg-brand-rule mb-5" />
        <Txt variant="eyebrow">{t('s.opening.eyebrow')}</Txt>
        <Txt variant="title" className="mt-2">{t('s.opening.title', { count: shown.length })}</Txt>
        <Txt variant="body" className="mt-1 mb-4">{t('s.opening.body')}</Txt>
        {rows.map((item) => (
          <View key={item.key} className="border-t border-brand-rule">
            <NavRow
              avatar={item.person}
              leading={item.person ? undefined : (
                <View className="w-10 h-10 rounded-full bg-brand-paper-sunk items-center justify-center">
                  <GoraIcon name="calendar" size={18} color={C.ink} />
                </View>
              )}
              title={item.title}
              caption={item.line}
              onPress={() => go(item.href)}
            />
          </View>
        ))}
        {more > 0 ? <Txt variant="caption" className="mt-2">{t('s.opening.more', { count: more })}</Txt> : null}
        <View className="mt-5">
          <SecondaryButton label={t('s.opening.seeEverything')} tone="ink" onPress={() => go('/(tabs)/invites')} />
        </View>
      </Animated.View>
    </Modal>
  );
}
