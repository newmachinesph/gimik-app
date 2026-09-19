import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { migrateInterests } from '@/lib/interests';
import { randomId } from '@/lib/random-id';

/**
 * Everything the demo knows, in one store, persisted on the device.
 *
 * Flat by design: every collection is keyed by id and every relation is an id
 * list, so a screen reads what it needs in one selector and a demo state is a
 * plain object that can be dropped in whole. The API, when it arrives, mirrors
 * these shapes one for one.
 */

export type Gender = 'woman' | 'man' | 'nonbinary';
export type Party = 'duo' | 'group';
export type Audience = 'friends' | 'groups' | 'everyone';

export type Profile = {
  /** Stable backend identity; absent in demo/old cached profiles. */
  id?: string;
  tier?: 'free' | 'plus';
  plusUntil?: string | null;
  name: string;
  handle: string;
  birthday: string | null;
  gender: Gender | null;
  city: string | null;
  bio: string;
  /** Bumble-style headline facts, both optional. */
  work: string;
  education: string;
  /** Where you mostly grew up; `city` is where you are now. */
  hometown: string | null;
  /** Interest-bank slugs, at most MAX_INTERESTS; worn as emoji badges. */
  interests: string[];
  /** Language slugs, Philippine languages first-class. */
  languages: string[];
  /** Optional, never required, never filtered on. */
  religion: string | null;
  politics: string | null;
  photos: string[];
};

export type Visibility = { openTo: Audience[]; as: Party[] };

export type Invite = {
  id: string;
  from: string;
  wantId: string;
  party: Party;
  at: string;
  status: 'new' | 'seen' | 'accepted' | 'declined';
};

export type FriendRequest = { from: string; at: string };
export type Group = { id: string; name: string; members: string[]; inviteToken: string; createdAt: string };
export type Message = {
  id: string;
  from: string;
  body: string;
  at: string;
  attachment?: { type: 'someday' | 'date' | 'place'; refId: string; label: string };
};
export type Thread = {
  id: string;
  kind: 'solo' | 'group' | 'plan';
  refId: string;
  title: string;
  messages: Message[];
  readAt: string | null;
  /** The someday this thread is about, pinned at the top. Plans carry it in refId. */
  wantId?: string;
};
export type Plan = {
  wantId: string;
  date: string;
  time?: string;
  people: string[];
  place?: string;
  placeId?: string;
  /** How the bill goes: KKB (kanya-kanyang bayad), equal split, my treat, or others. */
  split: 'kkb' | 'equal' | 'treat' | 'others';
  /** Only "others" needs saying out loud: "Jon covers gas, KKB on food". */
  splitNote?: string;
  proposals?: string[];
  confirmed: string[];
};
export type JournalEntry = { id: string; wantId: string; body: string; photo?: string; at: string };
export type DemoState = 'fresh' | 'week-in' | 'veteran';

/** Where the state in this store came from. Demo data and server data must
 *  never be mixed: their ids mean different things. */
export type DataSource = 'demo' | 'api';

export type AppData = {
  onboarded: boolean;
  demoState: DemoState;
  source: DataSource;
  profile: Profile;
  keptIds: string[];
  passedIds: string[];
  keptAt: Record<string, string>;
  visibility: Record<string, Visibility>;
  defaultVisibility: Visibility;
  rememberVisibility: boolean;
  plans: Record<string, Plan>;
  doneIds: string[];
  doneAt: Record<string, string>;
  journal: JournalEntry[];
  friends: string[];
  requests: FriendRequest[];
  sentRequests: string[];
  groups: Group[];
  invites: Invite[];
  hiddenPeople: string[];
  threads: Thread[];
  seenNewsKeys: string[];
};

export type AppState = AppData & {
  hydrated: boolean;
  setHydrated: () => void;
  setOnboarded: (value: boolean) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  keep: (id: string, visibility?: Visibility) => void;
  pass: (id: string) => void;
  unkeep: (id: string) => void;
  unpass: (id: string) => void;
  setVisibility: (id: string, visibility: Visibility) => void;
  setDefaultVisibility: (visibility: Visibility, remember: boolean) => void;
  lock: (plan: Plan) => void;
  updatePlan: (wantId: string, patch: Partial<Plan>) => void;
  unlock: (wantId: string) => void;
  markDone: (wantId: string) => void;
  addJournal: (entry: Omit<JournalEntry, 'id' | 'at'>) => void;
  requestFriend: (name: string) => void;
  acceptRequest: (name: string) => void;
  declineRequest: (name: string) => void;
  createGroup: (name: string) => string;
  joinGroup: (token: string) => Group | undefined;
  leaveGroup: (id: string) => void;
  acceptInvite: (id: string) => Thread;
  declineInvite: (id: string) => void;
  askPerson: (name: string, wantId: string, label: string, party: Party) => Thread;
  hidePerson: (name: string) => void;
  unhidePerson: (name: string) => void;
  markInvitesSeen: () => void;
  sendMessage: (threadId: string, body: string, attachment?: Message['attachment']) => void;
  openThread: (kind: Thread['kind'], refId: string, title: string, wantId?: string) => Thread;
  markThreadRead: (id: string) => void;
  markNewsSeen: (keys: string[]) => void;
  loadDemo: (state: DemoState, data: Partial<AppData>) => void;
  /** Replace everything with what the server just said. */
  loadServer: (data: Partial<AppData>) => void;
  reset: () => void;
};

export const emptyProfile: Profile = { name: '', handle: '', birthday: null, gender: null, city: null, bio: '', work: '', education: '', hometown: null, interests: [], languages: [], religion: null, politics: null, photos: [] };

const now = () => new Date().toISOString();
const without = (list: string[], id: string) => list.filter((item) => item !== id);
const withOnce = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const initialData: AppData = {
  onboarded: false,
  demoState: 'fresh',
  source: 'demo',
  profile: emptyProfile,
  keptIds: [],
  passedIds: [],
  keptAt: {},
  visibility: {},
  defaultVisibility: { openTo: ['friends'], as: ['duo', 'group'] },
  rememberVisibility: false,
  plans: {},
  doneIds: [],
  doneAt: {},
  journal: [],
  friends: [],
  requests: [],
  sentRequests: [],
  groups: [],
  invites: [],
  hiddenPeople: [],
  threads: [],
  seenNewsKeys: [],
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),
      setOnboarded: (onboarded) => set({ onboarded }),
      updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),

      keep: (id, visibility) =>
        set((state) => ({
          keptIds: withOnce(state.keptIds, id),
          passedIds: without(state.passedIds, id),
          keptAt: { ...state.keptAt, [id]: state.keptAt[id] ?? now() },
          visibility: { ...state.visibility, [id]: visibility ?? state.defaultVisibility },
        })),
      pass: (id) => set((state) => ({ passedIds: withOnce(state.passedIds, id), keptIds: without(state.keptIds, id) })),
      unkeep: (id) => set((state) => ({ keptIds: without(state.keptIds, id) })),
      unpass: (id) => set((state) => ({ passedIds: without(state.passedIds, id) })),
      setVisibility: (id, visibility) => set((state) => ({ visibility: { ...state.visibility, [id]: visibility } })),
      setDefaultVisibility: (defaultVisibility, rememberVisibility) => set({ defaultVisibility, rememberVisibility }),

      lock: (plan) =>
        set((state) => ({ plans: { ...state.plans, [plan.wantId]: plan }, keptIds: withOnce(state.keptIds, plan.wantId) })),
      updatePlan: (wantId, patch) =>
        set((state) => {
          const plan = state.plans[wantId];
          return plan ? { plans: { ...state.plans, [wantId]: { ...plan, ...patch } } } : {};
        }),
      unlock: (wantId) =>
        set((state) => {
          const { [wantId]: _dropped, ...plans } = state.plans;
          return { plans };
        }),
      markDone: (wantId) =>
        set((state) => ({ doneIds: withOnce(state.doneIds, wantId), doneAt: { ...state.doneAt, [wantId]: state.doneAt[wantId] ?? now() } })),
      addJournal: (entry) => set((state) => ({ journal: [...state.journal, { ...entry, id: randomId(), at: now() }] })),

      requestFriend: (name) => set((state) => ({ sentRequests: withOnce(state.sentRequests, name) })),
      acceptRequest: (name) =>
        set((state) => ({ friends: withOnce(state.friends, name), requests: state.requests.filter((request) => request.from !== name) })),
      declineRequest: (name) => set((state) => ({ requests: state.requests.filter((request) => request.from !== name) })),

      createGroup: (name) => {
        const group: Group = { id: randomId(), name, members: ['me'], inviteToken: randomId(), createdAt: now() };
        set((state) => ({ groups: [...state.groups, group] }));
        get().openThread('group', group.id, name);
        return group.id;
      },
      joinGroup: (token) => {
        const group = get().groups.find((item) => item.inviteToken === token);
        if (!group) return undefined;
        set((state) => ({ groups: state.groups.map((item) => (item.id === group.id ? { ...item, members: withOnce(item.members, 'me') } : item)) }));
        return group;
      },
      leaveGroup: (id) => set((state) => ({ groups: state.groups.filter((group) => group.id !== id) })),

      acceptInvite: (id) => {
        const invite = get().invites.find((item) => item.id === id);
        set((state) => ({ invites: state.invites.map((item) => (item.id === id ? { ...item, status: 'accepted' } : item)) }));
        return get().openThread('solo', invite?.from ?? '', invite?.from ?? '', invite?.wantId);
      },
      declineInvite: (id) =>
        set((state) => ({ invites: state.invites.map((item) => (item.id === id ? { ...item, status: 'declined' } : item)) })),

      /**
       * The other direction of the invite: you ask them. The thread opens with
       * the someday pinned and your ask already in it, because a demo with no
       * server cannot wait for a reply - and the corpus is clear that the ask
       * and the conversation are the same moment.
       */
      askPerson: (name, wantId, label, party) => {
        const thread = get().openThread('solo', name, name, wantId);
        get().sendMessage(
          thread.id,
          party === 'group' ? 'Doing this with a few people - in?' : 'Want to do this together?',
          { type: 'someday', refId: wantId, label },
        );
        return thread;
      },
      hidePerson: (name) =>
        set((state) => ({
          hiddenPeople: withOnce(state.hiddenPeople, name),
          invites: state.invites.map((item) => (item.from === name ? { ...item, status: 'declined' } : item)),
        })),
      unhidePerson: (name) => set((state) => ({ hiddenPeople: without(state.hiddenPeople, name) })),
      markInvitesSeen: () =>
        set((state) => ({ invites: state.invites.map((item) => (item.status === 'new' ? { ...item, status: 'seen' } : item)) })),

      openThread: (kind, refId, title, wantId) => {
        const existing = get().threads.find((thread) => thread.kind === kind && thread.refId === refId);
        if (existing) {
          if (wantId && !existing.wantId) set((state) => ({ threads: state.threads.map((thread) => (thread.id === existing.id ? { ...thread, wantId } : thread)) }));
          return existing;
        }
        const thread: Thread = { id: randomId(), kind, refId, title, messages: [], readAt: now(), wantId };
        set((state) => ({ threads: [thread, ...state.threads] }));
        return thread;
      },
      sendMessage: (threadId, body, attachment) =>
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? { ...thread, messages: [...thread.messages, { id: randomId(), from: 'me', body, at: now(), attachment }], readAt: now() }
              : thread,
          ),
        })),
      markThreadRead: (id) => set((state) => ({ threads: state.threads.map((thread) => (thread.id === id ? { ...thread, readAt: now() } : thread)) })),

      markNewsSeen: (keys) => set((state) => ({ seenNewsKeys: [...new Set([...state.seenNewsKeys, ...keys])] })),
      loadDemo: (demoState, data) =>
        set({ ...initialData, onboarded: true, source: 'demo', demoState, ...data }),
      // A whole-state swap, not a merge: a partial response must not leave
      // yesterday's demo rows sitting underneath today's real ones.
      loadServer: (data) => set({ ...initialData, onboarded: true, source: 'api', ...data }),
      reset: () => set({ ...initialData }),
    }),
    {
      name: 'gora-v2',
      // Bumped whenever the *meaning* of a persisted id changes. Demo state
      // keys people by name and somedays by a bundled id; server state keys
      // them by whatever the API said. A store that rehydrated across that
      // boundary would look plausible and be wrong, so it is discarded.
      version: 1,
      migrate: (persisted, from) => {
        if (from >= 1) return persisted as AppData;
        return { ...initialData } as AppData;
      },
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
      // A profile persisted before a field existed comes back without it, and
      // an undefined array is a class of crash. Rehydrate over the full shape
      // so every key always exists.
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<AppData> & { profile?: Partial<Profile> };
        const profile = { ...emptyProfile, ...(stored.profile ?? {}) };
        return {
          ...current,
          ...stored,
          profile: { ...profile, interests: migrateInterests(profile.interests ?? []) },
        };
      },
    },
  ),
);
