import { useMemo } from 'react';

import { WANTS, type Want } from '@/lib/mock';
import { registeredWant } from '@/lib/registry';
import { holdersOf, PERSON_BY_NAME } from '@/lib/people';
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

/** People who hold this someday and are not you or hidden. */
export function useHolders(want: Want | undefined) {
  const hidden = useApp((state) => state.hiddenPeople);
  return useMemo(
    () => (want ? holdersOf(want).filter((name) => !hidden.includes(name)).map((name) => PERSON_BY_NAME.get(name)).filter(Boolean) : []),
    [hidden, want],
  );
}