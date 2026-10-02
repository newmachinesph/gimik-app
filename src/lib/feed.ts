import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { hasApi } from '@/lib/api/client';
import { rememberSomeday } from '@/lib/api/directory';
import { catalog } from '@/lib/api/endpoints';
import { type Category, WANTS, type Want } from '@/lib/mock';
import { registerWant, wantFromDto } from '@/lib/registry';
import { wantById } from '@/lib/somedays';
import { useApp } from '@/store';

/**
 * The deck's supply of cards, from wherever the cards actually are.
 *
 * The screen above this does not know whether it is running against the API or
 * the bundled sample, and should not: it asks for the next cards and renders
 * them. Demo builds keep working exactly as before - that is the whole reason
 * the demo path is kept rather than deleted once the server exists.
 *
 * Live, the ranking is the server's (`GET /feed`), because it is the only side
 * that can see what friends kept and what the whole catalog holds. What stays
 * here is everything that has to feel instant:
 *
 * - **Decided cards leave immediately.** A swipe writes to the store and syncs
 *   in the background, so for a moment the server still believes a card is
 *   undecided. Filtering locally means the card is gone the frame it is swiped
 *   rather than the round trip after.
 * - **Refill before empty.** New cards are fetched while there are still a few
 *   left, so the deck never shows a spinner mid-swipe.
 * - **Resurfacing.** A someday kept long ago and never planned comes back with
 *   a "still want this?" stamp. That is a client-side idea - the server rightly
 *   never re-offers a keep - so those cards are mixed in here.
 *
 * One page of fetched cards is held in a single object stamped with the filter
 * it was fetched for. Changing the chip therefore shows an empty deck on the
 * very next render, with no effect resetting anything: state whose identity is
 * part of the state cannot be left over from the last query, and nothing here
 * calls setState synchronously from an effect.
 */

/** Fetched per request. Deeper than a sitting, so a refill is rare. */
const PAGE = 30;
/** Refill once the deck is this short, rather than when it is empty. */
const LOW_WATER = 8;
/** The filter chip that means "no filter". */
const ALL: Category = 'All';

type Loaded = {
  /** The filter these cards answer. Anything else is last question's answer. */
  key: string;
  items: Want[];
  secondLook: Set<string>;
  exhausted: boolean;
  failed: boolean;
};

const EMPTY: Loaded = { key: '', items: [], secondLook: new Set(), exhausted: false, failed: false };

let reload: (() => void) | null = null;
/**
 * Refetch the deck on screen. Blocking someone calls this once the server has
 * the block: a card does not carry its author, so the cards already fetched
 * cannot be filtered here, and theirs must not outlive the block.
 */
export const refreshDeck = (): void => reload?.();

export type Deck = {
  cards: Want[];
  /**
   * Cards the server offered from its second-look pool - things passed long
   * enough ago to be worth asking about again. The card says so rather than
   * pretending to be new, which is the difference between a second chance and
   * an app that quietly forgets what you told it.
   */
  secondLook: Set<string>;
  /** First load only - a refill must not blank a deck that already has cards. */
  loading: boolean;
  /** Every pool is empty. Show the end state; asking again returns the same. */
  exhausted: boolean;
  /** The last fetch failed and there is nothing to show. */
  failed: boolean;
  retry: () => void;
};

export function useDeck(category: Category, decided: Set<string>, stale: Set<string>): Deck {
  const source = useApp((state) => state.source);
  const live = hasApi && source === 'api';
  const key = category;

  const [loaded, setLoaded] = useState<Loaded>(EMPTY);
  // A ref rather than state: it guards the effect that would otherwise re-enter
  // on the very render its own update causes, and it must not itself render.
  const inFlight = useRef(false);

  /**
   * Somedays kept long ago and still without a date. The server will not offer
   * these - they are already on the list - so the resurfacing rule lives here.
   */
  const resurfaced = useMemo(
    () => [...stale].map(wantById).filter((want): want is Want => Boolean(want)),
    [stale],
  );

  /** Demo builds: the bundled sample, filtered the way the deck always did. */
  const sampled = useMemo(
    () =>
      WANTS.filter(
        (want) =>
          want.slug
          && (category === ALL || want.category === category)
          && (!decided.has(want.id) || stale.has(want.id)),
      ),
    [category, decided, stale],
  );

  /**
   * Every state change happens after the await, never synchronously - calling
   * setState in the body of an effect cascades a second render before the first
   * has painted, and this runs on every refill.
   */
  /** A full refresh asked for mid-fetch: run it when that fetch lands, or the
   *  page already on its way would bring a blocked person's cards back. */
  const refreshQueued = useRef(false);

  const load = useCallback(
    async (replace: boolean) => {
      if (inFlight.current) {
        if (replace) refreshQueued.current = true;
        return;
      }
      inFlight.current = true;
      try {
        const page = await catalog.feed({
          limit: PAGE,
          category: key === ALL ? undefined : key,
        });
        // Register before rendering: the rest of the app looks somedays up by
        // slug, and a card whose id the directory has never seen cannot be
        // kept, because the write path has no UUID to send.
        const resurfaced = new Set<string>();
        const incoming = page.items.map((item) => {
          rememberSomeday(item.someday);
          const want = {
            ...wantFromDto(item.someday, WANTS[0].photo),
            holders: item.keeps,
            friendHolders: item.friend_keeps,
          };
          registerWant(want);
          if (item.pool === 'second_look') resurfaced.add(want.id);
          return want;
        });
        setLoaded((current) => {
          const base = replace || current.key !== key ? [] : current.items;
          const seen = new Set(base.map((want) => want.id));
          return {
            key,
            items: [...base, ...incoming.filter((want) => !seen.has(want.id))],
            secondLook:
              replace || current.key !== key
                ? resurfaced
                : new Set([...current.secondLook, ...resurfaced]),
            exhausted: page.exhausted,
            failed: false,
          };
        });
      } catch {
        // Keep whatever is already on screen; the deck is still swipeable.
        setLoaded((current) =>
          current.key === key
            ? { ...current, failed: true }
            : { key, items: [], secondLook: new Set(), exhausted: false, failed: true },
        );
      } finally {
        inFlight.current = false;
        if (refreshQueued.current) {
          refreshQueued.current = false;
          reload?.();
        }
      }
    },
    [key],
  );

  /** Cards for the filter being asked about now, minus anything just decided. */
  const remaining = useMemo(
    () =>
      loaded.key === key ? loaded.items.filter((want) => !decided.has(want.id)) : [],
    [decided, key, loaded],
  );

  const settled = loaded.key === key;
  const spent = settled && (loaded.exhausted || loaded.failed);

  // One effect, and it only fetches. Fires for the first page of a new filter
  // and again whenever the deck runs low.
  useEffect(() => {
    if (!live || spent) return;
    // load() only updates state after its await; the rule cannot see past the
    // async call, so it reads this as a synchronous set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (remaining.length < LOW_WATER) void load(!settled);
  }, [live, load, remaining.length, settled, spent]);

  useEffect(() => {
    reload = () => void load(true);
    return () => { reload = null; };
  }, [load]);

  const cards = useMemo(
    () => (live ? [...resurfaced, ...remaining] : sampled),
    [live, remaining, resurfaced, sampled],
  );

  return {
    cards,
    secondLook: settled ? loaded.secondLook : EMPTY.secondLook,
    loading: live && !settled && cards.length === 0,
    // Only truly empty when the server has nothing and nothing is resurfacing.
    exhausted: live ? settled && loaded.exhausted && cards.length === 0 : cards.length === 0,
    failed: live && settled && loaded.failed && cards.length === 0,
    retry: () => void load(true),
  };
}
