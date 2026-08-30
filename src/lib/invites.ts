import { useMemo } from 'react';

import { PERSON_BY_NAME, type Person } from '@/lib/people';
import { wantById } from '@/lib/somedays';
import { useApp, type Invite } from '@/store';
import type { Want } from '@/lib/mock';

/**
 * An invite is a question about a weekend, so it stops being one after a week.
 *
 * Expiry is derived from `at` rather than written into the invite, which means
 * there is no sweeper to run and no migration to write: the same rule answers
 * "is this live?" on every surface, and a demo state that sat on a phone for a
 * fortnight ages out correctly the moment it is read.
 *
 * Nothing is deleted. The invite keeps its status and its place in history; it
 * simply stops being asked about. Letting one lapse is the quietest way to say
 * no, and - as with Not now - the sender is never told which it was.
 */
export const INVITE_EXPIRES_AFTER_DAYS = 7;

/** Only inside this window does an invite admit it is running out. A countdown
 *  that runs all week is pressure; one that appears at the end is information. */
export const INVITE_URGENT_WITHIN_HOURS = 48;

const HOUR = 3_600_000;

export function inviteHoursLeft(invite: Invite, now = Date.now()): number {
  const expiresAt = new Date(invite.at).getTime() + INVITE_EXPIRES_AFTER_DAYS * 24 * HOUR;
  return Math.ceil((expiresAt - now) / HOUR);
}

/** Waiting on an answer: neither answered nor lapsed. */
export function isInviteLive(invite: Invite, now = Date.now()): boolean {
  if (invite.status !== 'new' && invite.status !== 'seen') return false;
  return inviteHoursLeft(invite, now) > 0;
}

export type InviteRowData = { invite: Invite; person: Person; want: Want; hoursLeft: number };

/**
 * Every invite still waiting on you, newest first, resolved against the seeded
 * world. One definition, so the tab badge, the opening sheet and the Invites
 * screen can never disagree about how many there are.
 */
export function useLiveInvites(): InviteRowData[] {
  const invites = useApp((state) => state.invites);
  const hidden = useApp((state) => state.hiddenPeople);
  return useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- expiry is a function of the wall clock
    const now = Date.now();
    return invites
      .filter((invite) => isInviteLive(invite, now) && !hidden.includes(invite.from))
      .map((invite) => ({
        invite,
        person: PERSON_BY_NAME.get(invite.from),
        want: wantById(invite.wantId),
        hoursLeft: inviteHoursLeft(invite, now),
      }))
      .filter((row): row is InviteRowData => Boolean(row.person && row.want))
      .sort((a, b) => b.invite.at.localeCompare(a.invite.at));
  }, [hidden, invites]);
}
