import { beforeEach, describe, expect, it } from 'vitest';

import { resetRegistry, registeredWant } from '@/lib/registry';
import { resetDirectory, planId, somedayId, threadId, userId } from './directory';
import {
  toFriends,
  toGroups,
  toInvites,
  toJournal,
  toKeeps,
  toPlans,
  toProfile,
  toThread,
} from './mapping';
import type { GroupOut, HolderOut, ProfileOut, SomedayOut, ThreadOut } from './schema';

const ME = 'Bea';

const someday = (over: Partial<SomedayOut> = {}): SomedayOut => ({
  id: 'sd-uuid-1',
  slug: 'see-an-aurora',
  title: 'See an aurora',
  category: 'Nature',
  party: 'group',
  needs: [],
  artwork_url: 'http://store/aurora.webp',
  ...over,
});

const holder = (over: Partial<HolderOut> = {}): HolderOut => ({
  id: 'user-uuid-1',
  name: 'Mara Ilagan',
  handle: 'mara',
  gender: 'woman',
  city: 'Cebu City',
  ...over,
});

beforeEach(() => {
  resetDirectory();
  resetRegistry();
});

describe('toProfile', () => {
  const base: ProfileOut = {
    id: 'u1', name: 'Bea', handle: 'bea', birthday: '1998-01-01', gender: 'woman',
    city: 'Cebu City', bio: 'hi', work: 'Dive instructor', education: 'USC',
    interests: ['surfing'], hometown: 'Cebu City', languages: ['english'],
    religion: null, politics: null, created_at: '2026-01-01T00:00:00Z', photos: [],
  };

  it('orders photos by position, not by arrival', () => {
    const profile = toProfile({
      ...base,
      photos: [
        { id: 'p2', position: 2, url: 'two.jpg' },
        { id: 'p0', position: 0, url: 'zero.jpg' },
        { id: 'p1', position: 1, url: 'one.jpg' },
      ],
    });
    expect(profile.photos).toEqual(['zero.jpg', 'one.jpg', 'two.jpg']);
  });

  it('survives a profile with nothing optional set', () => {
    const profile = toProfile({ ...base, gender: null, city: null, birthday: null, hometown: null });
    expect(profile.gender).toBeNull();
    expect(profile.photos).toEqual([]);
    expect(profile.name).toBe('Bea');
  });
});

describe('toKeeps', () => {
  it('maps a keep onto the bundled want id, not the uuid', () => {
    const { keptIds, visibility, keptAt } = toKeeps([
      { someday: someday(), open_to: ['friends', 'everyone'], party_as: ['duo'], kept_at: '2026-01-02T00:00:00Z' },
    ]);
    // 'see-an-aurora' is a bundled slug, so the store keeps the authored id.
    expect(keptIds).toHaveLength(1);
    expect(keptIds[0]).not.toBe('sd-uuid-1');
    expect(visibility[keptIds[0]]).toEqual({ openTo: ['friends', 'everyone'], as: ['duo'] });
    expect(keptAt[keptIds[0]]).toBe('2026-01-02T00:00:00Z');
    expect(somedayId('see-an-aurora')).toBe('sd-uuid-1');
  });

  it('adopts a someday this build never bundled, keyed by its slug', () => {
    const { keptIds } = toKeeps([
      { someday: someday({ id: 'sd-9', slug: 'ride-a-zeppelin', title: 'Ride a zeppelin' }),
        open_to: [], party_as: [], kept_at: '2026-01-02T00:00:00Z' },
    ]);
    expect(keptIds).toEqual(['ride-a-zeppelin']);
    expect(registeredWant('ride-a-zeppelin')?.title).toBe('Ride a zeppelin');
    expect(registeredWant('ride-a-zeppelin')?.photo).toBe('http://store/aurora.webp');
  });

  it('reads an empty open_to as Just me rather than dropping the keep', () => {
    const { keptIds, visibility } = toKeeps([
      { someday: someday(), open_to: [], party_as: [], kept_at: '2026-01-02T00:00:00Z' },
    ]);
    expect(visibility[keptIds[0]]).toEqual({ openTo: [], as: [] });
  });
});

describe('toInvites', () => {
  it('carries the sender by name and learns their id', () => {
    const invites = toInvites([
      { id: 'inv1', from_user: holder(), someday: someday(), party: 'duo',
        status: 'new', created_at: '2026-01-03T00:00:00Z' },
    ]);
    expect(invites[0].from).toBe('Mara Ilagan');
    expect(invites[0].party).toBe('duo');
    expect(userId('Mara Ilagan')).toBe('user-uuid-1');
  });
});

describe('toFriends', () => {
  it('separates mutual friends from incoming and outgoing requests', () => {
    const { friends, requests, sentRequests } = toFriends({
      friends: [holder()],
      requests: [{ id: 'fr1', from_user: holder({ id: 'u2', name: 'Ana Cruz', handle: 'ana' }), created_at: '2026-01-04T00:00:00Z' }],
      sent: [holder({ id: 'u3', name: 'Theo Lim', handle: 'theo' })],
    });
    expect(friends).toEqual(['Mara Ilagan']);
    expect(requests).toEqual([{ from: 'Ana Cruz', at: '2026-01-04T00:00:00Z' }]);
    expect(sentRequests).toEqual(['Theo Lim']);
  });
});

describe('toGroups', () => {
  it('writes the signed-in person as the literal me the store expects', () => {
    const dto: GroupOut = {
      id: 'g1', name: 'Saturday People', invite_token: 'saturday',
      members: [holder({ id: 'me-uuid', name: ME, handle: 'bea' }), holder()],
      created_at: '2026-01-01T00:00:00Z',
    };
    const [group] = toGroups([dto], ME);
    expect(group.members).toEqual(['me', 'Mara Ilagan']);
    expect(group.inviteToken).toBe('saturday');
  });
});

describe('toThread', () => {
  const base = (over: Partial<ThreadOut> = {}): ThreadOut => ({
    id: 'th1', kind: 'solo', title: 'Mara Ilagan', someday: null, plan_id: null,
    group_id: null, participants: [holder({ id: 'me-uuid', name: ME, handle: 'bea' }), holder()],
    last_message: null, unread: false, created_at: '2026-01-01T00:00:00Z', ...over,
  });

  it('keys a duo thread on the other person, never on yourself', () => {
    const thread = toThread(base(), ME);
    expect(thread.refId).toBe('Mara Ilagan');
    expect(thread.title).toBe('Mara Ilagan');
    expect(threadId('Mara Ilagan')).toBe('th1');
  });

  it('keys a group thread on the group and a plan thread on the someday', () => {
    expect(toThread(base({ kind: 'group', group_id: 'g1', title: 'Saturday People' }), ME).refId).toBe('g1');
    const plan = toThread(base({ kind: 'plan', plan_id: 'p1', someday: someday() }), ME);
    expect(plan.refId).not.toBe('p1');
    expect(plan.wantId).toBe(plan.refId);
  });

  it('turns unread into an absent watermark and read into a present one', () => {
    expect(toThread(base({ unread: true }), ME).readAt).toBeNull();
    expect(toThread(base({ unread: false }), ME).readAt).not.toBeNull();
  });

  it('marks your own messages as me so bubbles land on the right side', () => {
    const thread = toThread(base({
      last_message: { id: 'm1', sender: holder({ id: 'me-uuid', name: ME, handle: 'bea' }),
                      body: 'hi', attachment: null, created_at: '2026-01-02T00:00:00Z' },
    }), ME);
    expect(thread.messages[0].from).toBe('me');
  });

  it('renames an attachment ref to the field the store reads', () => {
    const thread = toThread(base({
      last_message: { id: 'm1', sender: holder(), body: 'this one?',
                      attachment: { type: 'someday', ref: 'sd-uuid-1', label: 'See an aurora' },
                      created_at: '2026-01-02T00:00:00Z' },
    }), ME);
    expect(thread.messages[0].attachment).toEqual({
      type: 'someday', refId: 'sd-uuid-1', label: 'See an aurora',
    });
  });

  it('does not fall over when a thread has no other participant', () => {
    const thread = toThread(base({ participants: [holder({ id: 'me-uuid', name: ME, handle: 'bea' })] }), ME);
    expect(thread.refId).toBe('Mara Ilagan');
  });
});

describe('toPlans', () => {
  const plan = (over: Partial<import('./schema').PlanOut> = {}): import('./schema').PlanOut => ({
    id: 'plan-uuid-1', someday: someday(), date: '2026-02-01', time_slot: '09:00',
    place: 'Sugbo Mercado', place_id: null, split: 'kkb',
    people: [holder({ id: 'me-uuid', name: ME, handle: 'bea' }), holder()],
    confirmed_ids: ['user-uuid-1'], done_at: null, thread_id: 'th1',
    created_at: '2026-01-01T00:00:00Z', ...over,
  });

  it('keys the plan by someday and leaves you out of its people', () => {
    const { plans } = toPlans([plan()], ME);
    const [wantId] = Object.keys(plans);
    expect(plans[wantId].people).toEqual(['Mara Ilagan']);
    expect(plans[wantId].confirmed).toEqual(['Mara Ilagan']);
    expect(plans[wantId].time).toBe('09:00');
    expect(planId(wantId)).toBe('plan-uuid-1');
  });

  it('lifts a finished plan into the record', () => {
    const { doneIds, doneAt } = toPlans([plan({ done_at: '2026-02-02T10:00:00Z' })], ME);
    expect(doneIds).toHaveLength(1);
    expect(doneAt[doneIds[0]]).toBe('2026-02-02T10:00:00Z');
  });

  it('leaves an unfinished plan out of the record', () => {
    expect(toPlans([plan()], ME).doneIds).toEqual([]);
  });

  it('keeps a solo plan a plan', () => {
    const { plans } = toPlans([plan({ people: [holder({ id: 'me-uuid', name: ME, handle: 'bea' })], confirmed_ids: [] })], ME);
    const [wantId] = Object.keys(plans);
    expect(plans[wantId].people).toEqual([]);
  });
});

describe('toJournal', () => {
  it('drops an entry whose someday cannot be resolved rather than rendering a blank', () => {
    const entries = toJournal(
      [
        { id: 'j1', someday_id: 'sd-uuid-1', body: 'good day', photo_url: null, created_at: '2026-01-01T00:00:00Z' },
        { id: 'j2', someday_id: 'unknown', body: 'orphan', photo_url: null, created_at: '2026-01-01T00:00:00Z' },
      ],
      (id) => (id === 'sd-uuid-1' ? 'w1' : undefined),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].wantId).toBe('w1');
    expect(entries[0].photo).toBeUndefined();
  });

  it('keeps a photo when the server has one', () => {
    const [entry] = toJournal(
      [{ id: 'j1', someday_id: 's', body: '', photo_url: 'http://store/j1.webp', created_at: '2026-01-01T00:00:00Z' }],
      () => 'w1',
    );
    expect(entry.photo).toBe('http://store/j1.webp');
  });
});
