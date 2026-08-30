import { describe, expect, it } from 'vitest';

import { INVITE_EXPIRES_AFTER_DAYS, inviteHoursLeft, isInviteLive } from './invites';
import type { Invite } from '@/store';

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const invite = (hoursAgo: number, status: Invite['status'] = 'new'): Invite => ({
  id: 'i1',
  from: 'Mara Ilagan',
  wantId: 'w1',
  party: 'duo',
  at: new Date(NOW - hoursAgo * HOUR).toISOString(),
  status,
});

describe('invite lifetime', () => {
  it('gives a fresh invite the full week', () => {
    expect(inviteHoursLeft(invite(0), NOW)).toBe(INVITE_EXPIRES_AFTER_DAYS * 24);
  });

  it('counts down as it ages', () => {
    expect(inviteHoursLeft(invite(152), NOW)).toBe(16);
  });

  it('is live right up to the boundary and not past it', () => {
    expect(isInviteLive(invite(167), NOW)).toBe(true);
    expect(isInviteLive(invite(168), NOW)).toBe(false);
    expect(isInviteLive(invite(169), NOW)).toBe(false);
  });

  it('treats an answered invite as not live regardless of age', () => {
    expect(isInviteLive(invite(1, 'accepted'), NOW)).toBe(false);
    expect(isInviteLive(invite(1, 'declined'), NOW)).toBe(false);
    expect(isInviteLive(invite(1, 'seen'), NOW)).toBe(true);
  });

  it('does not resurrect a lapsed invite that was merely seen', () => {
    expect(isInviteLive(invite(200, 'seen'), NOW)).toBe(false);
  });
});
