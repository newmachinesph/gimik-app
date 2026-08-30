import { resetRegistry } from '@/lib/registry';
import { useApp, type AppData } from '@/store';
import { resetDirectory, somedaySlug } from './directory';
import { auth, catalog, groups as groupsApi, plans as plansApi, social, threads as threadsApi } from './endpoints';
import {
  toFriends,
  toGroups,
  toInvites,
  toKeeps,
  toHidden,
  toPlans,
  toProfile,
  toThreads,
} from './mapping';
import { wantIdForSlug } from '@/lib/somedays';

/**
 * Everything the app needs to open, in one pass.
 *
 * Eight requests rather than eight screens each fetching for itself: the store
 * is the app's single source of truth and every screen already reads it, so
 * filling it once at sign-in keeps the screens synchronous and makes the whole
 * hydration a single thing that can succeed or fail. The requests are issued
 * together because none of them depend on another's answer.
 *
 * The directory is cleared first: it maps names and slugs onto server ids, and
 * a stale entry would point a write at the wrong row.
 */
export async function hydrateFromApi(): Promise<void> {
  resetDirectory();
  resetRegistry();

  const [profile, keeps, invites, friends, groups, threads, plans, hidden] = await Promise.all([
    auth.me(),
    catalog.mine(),
    social.invites(),
    social.friends(),
    groupsApi.list(),
    threadsApi.list(),
    plansApi.list(),
    social.hidden(),
  ]);

  const me = profile.name;
  const kept = toKeeps(keeps);
  const planned = toPlans(plans, me);
  const friendship = toFriends(friends);

  const data: Partial<AppData> = {
    profile: toProfile(profile),
    ...kept,
    ...planned,
    ...friendship,
    invites: toInvites(invites),
    hiddenPeople: toHidden(hidden),
    groups: toGroups(groups, me),
    threads: toThreads(threads, me),
    // Kept ids must include everything with a plan, or a locked someday would
    // vanish from the list it was locked from.
    keptIds: [...new Set([...kept.keptIds, ...Object.keys(planned.plans)])],
  };

  useApp.getState().loadServer(data);
}

/** One thread, in full. The list only carries its last message. */
export async function loadThread(id: string): Promise<void> {
  const me = useApp.getState().profile.name;
  const detail = await threadsApi.get(id);
  const { toThread } = await import('./mapping');
  const mapped = toThread(detail, me);
  useApp.setState((state) => ({
    threads: state.threads.map((thread) => (thread.id === id ? mapped : thread)),
  }));
}

/** The journal for one someday, fetched when its screen opens. */
export async function loadJournal(wantId: string): Promise<void> {
  const { somedayId } = await import('./directory');
  const { toJournal } = await import('./mapping');
  const slug = wantId;
  const id = somedayId(slug);
  if (!id) return;
  const entries = await plansApi.journal(id);
  const mapped = toJournal(entries, (somedayUuid) => {
    const resolved = somedaySlug(somedayUuid);
    return resolved ? wantIdForSlug(resolved) : undefined;
  });
  useApp.setState((state) => ({
    journal: [...state.journal.filter((entry) => entry.wantId !== wantId), ...mapped],
  }));
}
