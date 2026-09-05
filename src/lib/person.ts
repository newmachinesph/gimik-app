import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { hasApi } from '@/lib/api/client';
import { rememberPerson, rememberSomeday } from '@/lib/api/directory';
import { social } from '@/lib/api/endpoints';
import type { SomedayOut } from '@/lib/api/schema';
import { WANTS, type Want } from '@/lib/mock';
import { holds, PERSON_BY_NAME, type Person } from '@/lib/people';
import { personFromDto, registerPerson, registerWant, wantFromDto } from '@/lib/registry';
import { useApp } from '@/store';

/**
 * Who someone is, and what of theirs you are allowed to see.
 *
 * The person screen used to answer both from bundled data: the nine seeded
 * people, and `WANTS.filter(holds(person, want))` - a hand-authored table of
 * who wants what. Against a real account that is fiction twice over. It shows
 * somedays the person has never kept, and keeping one writes an id the
 * directory has never seen, so the write is applied on the phone and silently
 * skipped on the server.
 *
 * Live, both answers come from `GET /people/{handle}`, which already filters by
 * the holder's own visibility - friends, shared groups, same city - so this
 * hook never has to decide what may be shown. It only has to ask.
 *
 * The bundled cast stays for demo builds, and for the profile itself while a
 * fetch is in flight, so the screen never flashes empty. Their somedays do not:
 * showing invented keeps under a real name is the exact fiction this removes.
 */

export type PersonView = {
  person: Person | undefined;
  /** Their somedays, as the server is willing to show them to this viewer. */
  somedays: Want[];
  /** The ones you both want - the reason to open this screen at all. */
  inCommon: Want[];
  loading: boolean;
  isFriend: boolean;
  requestPending: boolean;
};

type Fetched = {
  key: string;
  person: Person;
  somedays: Want[];
  inCommon: Want[];
  isFriend: boolean;
  requestPending: boolean;
};

export function usePerson(name: string | undefined): PersonView {
  const source = useApp((state) => state.source);
  const live = hasApi && source === 'api';

  const bundled = name ? PERSON_BY_NAME.get(name) : undefined;
  const handle = bundled?.handle;
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!handle || inFlight.current) return;
    inFlight.current = true;
    try {
      const dto = await social.person(handle);
      rememberPerson(dto);
      const person = personFromDto(dto, String(dto.id));
      registerPerson(person);
      const convert = (list: SomedayOut[]) =>
        list.map((someday) => {
          rememberSomeday(someday);
          const want = wantFromDto(someday, WANTS[0].photo);
          registerWant(want);
          return want;
        });
      setFetched({
        key: handle,
        person,
        somedays: convert(dto.somedays),
        inCommon: convert(dto.in_common),
        isFriend: dto.is_friend,
        requestPending: dto.request_pending,
      });
    } catch {
      // Leave the bundled profile on screen rather than blanking it.
    } finally {
      inFlight.current = false;
    }
  }, [handle]);

  const settled = fetched?.key === handle;

  useEffect(() => {
    if (!live || settled) return;
    // load() only updates state after its await; the rule cannot see past the
    // async call, so it reads this as a synchronous set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [live, load, settled]);

  /** Demo builds: the hand-authored table of who wants what. */
  const bundledSomedays = useMemo(
    () => (bundled ? WANTS.filter((want) => holds(bundled, want)) : []),
    [bundled],
  );

  if (live && settled && fetched) {
    return {
      person: fetched.person,
      somedays: fetched.somedays,
      inCommon: fetched.inCommon,
      loading: false,
      isFriend: fetched.isFriend,
      requestPending: fetched.requestPending,
    };
  }

  return {
    person: bundled,
    somedays: live ? [] : bundledSomedays,
    inCommon: [],
    loading: live && Boolean(handle),
    isFriend: false,
    requestPending: false,
  };
}
