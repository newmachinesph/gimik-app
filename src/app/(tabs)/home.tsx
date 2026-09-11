import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { DecideDeck, type Decision } from '@/components/decide-deck';
import { KeepPrompt } from '@/components/keep-prompt';
import {
  BottomSheet,
  Chip,
  EmptyState,
  GUTTER,
  IconButton,
  Screen,
  TAB_BAR_HEIGHT,
  Txt,
} from '@/components/ui';
import { keep, pass, setVisibility, unkeep, unpass } from '@/lib/actions';
import { categoryChip } from '@/lib/interests';
import { useDeck } from '@/lib/feed';
import { CATEGORIES, categoryLabel, wantTitle, type Category, type Want } from '@/lib/mock';
import { RESURFACE_AFTER_DAYS } from '@/lib/somedays';
import { MOTION } from '@/lib/tokens';
import { useApp, type Visibility } from '@/store';

const OVERLAY_GAP = 12;

/**
 * Somedays: one card, one decision. Right keeps it and asks who it is open to;
 * left passes. A kept someday that has waited too long without a date comes
 * back through the same deck with a "still want this?" stamp.
 */
export default function Somedays() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const keptIds = useApp((state) => state.keptIds);
  const keptAt = useApp((state) => state.keptAt);
  const passedIds = useApp((state) => state.passedIds);
  const plans = useApp((state) => state.plans);
  const doneIds = useApp((state) => state.doneIds);
  const remember = useApp((state) => state.rememberVisibility);
  const defaultVisibility = useApp((state) => state.defaultVisibility);
  const setDefault = useApp((state) => state.setDefaultVisibility);
  const [boxHeight, setBoxHeight] = useState(0);
  /**
   * The deck arrives from the network, so its cards mount on whatever frame the
   * response lands on - and after signing in that frame is usually mid-stack
   * transition, which is precisely when Fabric cannot take new views ("child
   * already has a parent", and the surface is dead). The fetch still starts
   * immediately; only the mounting waits, so the delay costs nothing that the
   * request was not already spending.
   */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), MOTION.settle);
    return () => clearTimeout(timer);
  }, []);
  const [category, setCategory] = useState<Category>('All');
  const [filtering, setFiltering] = useState(false);
  const [prompt, setPrompt] = useState<Want | null>(null);
  const [decisions, setDecisions] = useState<{ want: Want; decision: Decision; resurfaced: boolean }[]>([]);

  const stale = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- wall clock read once per render is intended
    const cutoff = Date.now() - RESURFACE_AFTER_DAYS * 24 * 3_600_000;
    return new Set(keptIds.filter((id) => !plans[id] && !doneIds.includes(id) && new Date(keptAt[id] ?? 0).getTime() < cutoff));
  }, [doneIds, keptAt, keptIds, plans]);

  /** Everything already answered for. The deck asks about nothing in here. */
  const decided = useMemo(
    () => new Set([...keptIds, ...passedIds, ...doneIds]),
    [doneIds, keptIds, passedIds],
  );
  const { cards: deck, secondLook, loading, exhausted, failed, retry } = useDeck(category, decided, stale);
  /**
   * Two ways a card can be a repeat, and the card should say so either way: a
   * keep that has waited too long without a date (decided here), and a pass old
   * enough for the server to offer again.
   */
  const resurfacedIds = useMemo(() => new Set([...stale, ...secondLook]), [secondLook, stale]);

  const undoDecision = (last: { want: Want; decision: Decision; resurfaced: boolean }) => {
    if (last.decision === 'keep' && !last.resurfaced) unkeep(last.want.id);
    else if (last.decision === 'pass') unpass(last.want.id);
    if (last.resurfaced && last.decision === 'pass') keep(last.want.id);
  };

  const decide = (want: Want, decision: Decision) => {
    // Only a stale *keep* counts here, not a card the server re-offered. Passing
    // something already on your list is letting it go, and undo has to put the
    // keep back; passing an old pass again is just a pass.
    const resurfaced = stale.has(want.id);
    const entry = { want, decision, resurfaced };
    setDecisions((current) => [...current, entry]);
    void Haptics.impactAsync(decision === 'keep' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    if (decision === 'pass') {
      pass(want.id);
      // A resurfaced pass is the one quiet goodbye in the app; say it once.
      if (resurfaced) {
        toast(t('s.toasts.letGo', { title: wantTitle(want) }), {
          action: { label: t('s.common.undo'), onClick: () => { setDecisions((current) => current.filter((item) => item !== entry)); undoDecision(entry); } },
        });
      }
      return;
    }
    keep(want.id);
    if (resurfaced) {
      toast(t('s.toasts.keptStill', { title: wantTitle(want) }));
      return;
    }
    // The first keep asks who it is open to; "remember" makes it the last time.
    // When the prompt is remembered away, the toast is the only confirmation.
    if (!remember) setPrompt(want);
    else {
      toast(t('s.toasts.kept', { title: wantTitle(want) }), {
        action: { label: t('s.common.undo'), onClick: () => { setDecisions((current) => current.filter((item) => item !== entry)); undoDecision(entry); } },
      });
    }
  };

  const undoLast = () => {
    const last = decisions.at(-1);
    if (!last) return;
    setDecisions((current) => current.slice(0, -1));
    undoDecision(last);
    toast(t('s.toasts.broughtBack'));
  };

  const confirmPrompt = (visibility: Visibility, rememberChoice: boolean) => {
    if (prompt) setVisibility(prompt.id, visibility);
    setDefault(visibility, rememberChoice);
    setPrompt(null);
  };

  const onBox = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setBoxHeight((current) => (current === height ? current : height));
  };
  const deckHeight = Math.max(320, boxHeight - (insets.bottom + TAB_BAR_HEIGHT) - OVERLAY_GAP);

  return (
    <Screen scroll={false} padded={false}>
      <View className="px-5 pt-2 pb-3 flex-row items-center">
        <Txt variant="title" headingLevel={1} className="flex-1">Gimik</Txt>
        {decisions.length ? (
          <View className="mr-2">
            <IconButton icon="undo" label={t('s.home.undo')} onPress={undoLast} />
          </View>
        ) : null}
        <IconButton icon="filter" label={t('s.home.filter')} onPress={() => setFiltering(true)} />
      </View>

      <View className="flex-1" onLayout={onBox}>
        {boxHeight > 0 && settled ? (
          deck.length ? (
            <View style={{ paddingHorizontal: GUTTER }}>
              <DecideDeck wants={deck} height={deckHeight} resurfacedIds={resurfacedIds} onDecide={decide} onOpen={(want) => router.push(`/want/${want.id}` as never)} />
            </View>
          ) : loading ? (
            <View className="px-5">
              <EmptyState icon="sparkle" title={t('s.home.loading.title')} body={t('s.home.loading.body')} />
            </View>
          ) : failed ? (
            // A failed fetch is not an empty catalog, and saying so lets the
            // person retry instead of believing they have seen everything.
            <View className="px-5">
              <EmptyState icon="sparkle" title={t('s.home.offline.title')} body={t('s.home.offline.body')} action={t('s.home.offline.action')} onAction={retry} />
            </View>
          ) : exhausted ? (
            <View className="px-5">
              <EmptyState icon="sparkle" title={t('s.home.done.title')} body={t('s.home.done.body')} action={t('s.home.done.action')} onAction={() => router.push('/create' as never)} />
            </View>
          ) : (
            <View className="px-5">
              <EmptyState icon="sparkle" title={t('s.home.empty.title')} body={t('s.home.empty.body')} action={t('s.home.empty.action')} onAction={() => router.push('/(tabs)/discover' as never)} />
            </View>
          )
        ) : null}
      </View>

      <KeepPrompt want={prompt} initial={defaultVisibility} onDone={confirmPrompt} onDismiss={() => setPrompt(null)} />

      <BottomSheet visible={filtering} onDismiss={() => setFiltering(false)} label={t('s.common.close')}>
        <Txt variant="eyebrow">{t('s.home.filterSheet.eyebrow')}</Txt>
        <Txt variant="title" className="mt-2">{t('s.home.filterSheet.title')}</Txt>
        <Txt variant="caption" className="mt-1 mb-5">{t('s.home.filterSheet.left', { count: deck.length })}</Txt>
        <View className="flex-row flex-wrap gap-2 pb-2">
          {CATEGORIES.map((item) => (
            <Chip key={item} label={categoryChip(item, categoryLabel(item))} selected={category === item} onPress={() => { setCategory(item); setFiltering(false); }} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}
