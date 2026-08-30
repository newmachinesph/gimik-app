import { WANTS } from '@/lib/mock';
import { PEOPLE } from '@/lib/people';
import type { AppData, DemoState, Invite, Thread } from '@/store';

/**
 * Three snapshots of a life in the app, so every screen can be seen full,
 * half-full and empty without a server. Ids come from the seeded catalog; the
 * dates are relative to today so a plan is always "this Saturday", never stale.
 */
const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};
const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

const social = (count: number) => WANTS.filter((want) => want.party === 'duo' || want.party === 'group').slice(0, count);
const names = PEOPLE.map((person) => person.name);

function weekIn(): Partial<AppData> {
  const kept = WANTS.slice(0, 12);
  const [lockedA, lockedB] = kept;
  const done = WANTS[12];
  const invites: Invite[] = social(6).map((want, index) => ({
    id: `inv-${index}`,
    from: names[index % names.length],
    wantId: want.id,
    party: index % 3 === 0 ? 'group' : 'duo',
    // The last one is nearly out of time, so the 48h caption has a home.
    at: index === 5 ? ago(152) : ago(2 + index * 5),
    status: index < 3 ? 'new' : 'seen',
  }));
  const threads: Thread[] = [
    {
      id: 'thread-mara',
      kind: 'solo',
      refId: names[0],
      title: names[0],
      readAt: null,
      messages: [
        { id: 'm1', from: names[0], body: 'Saturday works for me if the tide is right. You?', at: ago(3) },
      ],
    },
    {
      id: 'thread-group',
      kind: 'group',
      refId: 'group-saturday',
      title: 'Saturday People',
      readAt: ago(30),
      messages: [
        { id: 'm2', from: names[1], body: 'Who is in for the canyon kayak next month?', at: ago(28) },
        { id: 'm3', from: names[3], body: 'Me. I can bring a second boat.', at: ago(26) },
      ],
    },
  ];
  return {
    keptIds: [...kept.map((want) => want.id), done.id],
    keptAt: Object.fromEntries(kept.map((want, index) => [want.id, ago(24 * (kept.length - index))])),
    plans: {
      [lockedA.id]: { wantId: lockedA.id, date: day(2), time: '09:00', people: [names[0]], split: 'kkb', confirmed: [names[0]] },
      [lockedB.id]: { wantId: lockedB.id, date: day(16), people: [names[1], names[3]], split: 'kkb', confirmed: [names[1]] },
    },
    doneIds: [done.id],
    doneAt: { [done.id]: ago(24 * 3) },
    journal: [{ id: 'j1', wantId: done.id, body: 'Colder than expected. Would do it again tomorrow.', at: ago(24 * 3) }],
    friends: [names[0], names[3]],
    requests: [{ from: names[2], at: ago(6) }, { from: names[5], at: ago(20) }],
    groups: [{ id: 'group-saturday', name: 'Saturday People', members: ['me', names[1], names[3], names[6]], inviteToken: 'saturday', createdAt: ago(24 * 9) }],
    invites,
    threads,
  };
}

function veteran(): Partial<AppData> {
  const base = weekIn();
  const kept = WANTS.slice(0, 40);
  const plans = Object.fromEntries(
    kept.slice(0, 8).map((want, index) => [want.id, { wantId: want.id, date: day(1 + index * 4), people: [names[index % names.length]], split: 'kkb' as const, confirmed: [] }]),
  );
  const done = WANTS.slice(40, 45);
  return {
    ...base,
    keptIds: [...kept.map((want) => want.id), ...done.map((want) => want.id)],
    plans,
    doneIds: done.map((want) => want.id),
    doneAt: Object.fromEntries(done.map((want, index) => [want.id, ago(24 * 10 * (index + 1))])),
    friends: names.slice(0, 6),
    invites: social(14).map((want, index) => ({ id: `inv-${index}`, from: names[index % names.length], wantId: want.id, party: index % 2 ? 'duo' : 'group', at: ago(index * 7), status: index < 5 ? 'new' : 'seen' })),
  };
}

export const DEMO: Record<DemoState, () => Partial<AppData>> = {
  fresh: () => ({}),
  'week-in': weekIn,
  veteran,
};