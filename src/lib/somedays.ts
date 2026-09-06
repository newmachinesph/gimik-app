import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { hasApi } from '@/lib/api/client';
import { rememberPerson, somedayId } from '@/lib/api/directory';
import { catalog } from '@/lib/api/endpoints';
import { WANTS, type Want } from '@/lib/mock';
import { personFromDto, registerPerson, registeredWant } from '@/lib/registry';
import { holdersOf, PERSON_BY_NAME, type Person } from '@/lib/people';
import { useApp } from '@/store';

/** The catalog, indexed once. */
const BUNDLED_BY_ID = new Map(WANTS.map((want) => [want.id, want]));
export const WANT_BY_SLUG = new Map(WANTS.filter((want) => want.slug).map((want) => [want.slug!, want]));

/** Bundled first - it carries the authored photograph and note - then whatever
 *  the server registered this session. Same `.get` shape the call sites expect. */
export const WANT_BY_ID = {
  get: (id: string): Want | undefined => BUNDLED_BY_ID.get(id) ?? registeredWant(id),
};
export const wantById = (id: string | undefined) => (id ? WANT_BY_ID.get(id) : undefined);

/** The app's own id for a server slug: the bundled want when there is one, so
 *  authored artwork wins, otherwise the slug itself. */
export const wantIdForSlug = (slug: string) => WANT_BY_SLUG.get(slug)?.id ?? slug;

/** Days a kept someday has waited without a date before the deck asks again. */
export const RESURFACE_AFTER_DAYS = 90;

export type SomedayState = 'undecided' | 'kept' | 'locked' | 'done' | 'passed';

/** One answer for "where is this someday in my life", used by every card. */
export function useSomedayState(id: string | undefined): SomedayState {
  const kept = useApp((state) => (id ? state.keptIds.includes(id) : false));
  const passed = useApp((state) => (id ? state.passedIds.includes(id) : false));
  const locked = useApp((state) => (id ? Boolean(state.plans[id]) : false));
  const done = useApp((state) => (id ? state.doneIds.includes(id) : false));
  if (done) return 'done';
  if (locked) return 'locked';
  if (kept) return 'kept';
  if (passed) return 'passed';
  return 'undecided';
}

/** Your list: kept somedays that are not done, newest first. */
export function useMine(): { kept: Want[]; locked: Want[]; waiting: Want[]; done: Want[] } {
  const keptIds = useApp((state) => state.keptIds);
  const plans = useApp((state) => state.plans);
  const doneIds = useApp((state) => state.doneIds);
  const doneAt = useApp((state) => state.doneAt);
  return useMemo(() => {
    const kept = keptIds.map(wantById).filter((want): want is Want => Boolean(want));
    const done = kept.filter((want) => doneIds.includes(want.id)).sort((a, b) => (doneAt[b.id] ?? '').localeCompare(doneAt[a.id] ?? ''));
    const live = kept.filter((want) => !doneIds.includes(want.id));
    const locked = live.filter((want) => plans[want.id]).sort((a, b) => plans[a.id].date.localeCompare(plans[b.id].date));
    const waiting = live.filter((want) => !plans[want.id]).reverse();
    return { kept: live, locked, waiting, done };
  }, [doneAt, doneIds, keptIds, plans]);
}

/**
 * People who hold this someday and are not you or hidden.
 *
 * Live, this is `GET /somedays/{id}/holders`, which is the only thing that can
 * answer it: whether a keep is visible to you is the holder's own choice, made
 * per someday, and the server is where that choice lives. The bundled answer -
 * a hand-authored table of which of the nine demo people wants what - is fiction
 * against a real catalog, and on the lock screen it was worse than cosmetic: it
 * offered demo people to invite to a real plan.
 */
export function useHolders(want: Want | undefined) {
  const hidden = useApp((state) => state.hiddenPeople);
  const source = useApp((state) => state.source);
  const live = hasApi && source === 'api';

  const slug = want?.slug ?? want?.id;
  const uuid = slug ? somedayId(slug) : undefined;
  const [fetched, setFetched] = useState<{ key: string; people: Person[] } | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!uuid || inFlight.current) return;
    inFlight.current = true;
    try {
      const rows = await catalog.holders(uuid);
      const people = rows.map((row) => {
        rememberPerson(row);
        const person = personFromDto(row, String(row.id));
        registerPerson(person);
        return person;
      });
      setFetched({ key: uuid, people });
    } catch {
      // An unreachable server is not "nobody wants this"; leave it empty and
      // let the next open try again rather than asserting a lonely someday.
    } finally {
      inFlight.current = false;
    }
  }, [uuid]);

  const settled = fetched?.key === uuid;

  useEffect(() => {
    if (!live || !uuid || settled) return;
    // load() only updates state after its await; the rule cannot see past the
    // async call, so it reads this as a synchronous set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [live, load, settled, uuid]);

  const bundled = useMemo(
    () =>
      want
        ? holdersOf(want)
            .map((name) => PERSON_BY_NAME.get(name))
            .filter((person): person is Person => Boolean(person))
        : [],
    [want],
  );

  return useMemo(() => {
    const people = live ? (settled && fetched ? fetched.people : []) : bundled;
    return people.filter((person) => !hidden.includes(person.name));
  }, [bundled, fetched, hidden, live, settled]);
}

/**
 * How far along a someday you cannot finish in one sitting.
 *
 * Twenty-nine catalog concepts have always carried a completion of count,
 * distance, duration or streak - "100 islands in a year", "30 day plank
 * challenge" - and nothing in the app could record a single island of one. It
 * offered a Lock-a-date button and behaved as though an evening would finish
 * it. This is the missing verb, and the screen shows it only for the somedays
 * that actually work that way.
 */
export function useProgress(want: Want | undefined) {
  const source = useApp((state) => state.source);
  const live = hasApi && source === 'api';
  const trackable = Boolean(want?.completion && want.completion !== 'single');

  const slug = want?.slug ?? want?.id;
  const uuid = slug ? somedayId(slug) : undefined;
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const loaded = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!live || !trackable || !uuid || loaded.current === uuid) return;
    loaded.current = uuid;
    // Sets state only in the promise callbacks, well after the effect body.
    void catalog
      .progress(uuid)
      .then((row) => setCount(row.count))
      .catch(() => setCount(0));
  }, [live, trackable, uuid]);

  const add = useCallback(
    async (step = 1) => {
      if (!uuid || busy) return;
      setBusy(true);
      try {
        const row = await catalog.addProgress(uuid, step);
        setCount(row.count);
      } catch {
        // The server refuses a count against a one-off someday, and a lost
        // increment is better than a number that never happened.
      } finally {
        setBusy(false);
      }
    },
    [busy, uuid],
  );

  return { trackable: trackable && live, count: count ?? 0, ready: count !== null, busy, add };
}
