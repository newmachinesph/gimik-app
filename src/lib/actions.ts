import { i18n } from '@/i18n';
import { hasApi } from '@/lib/api/client';
import { photoId as photoIdFor, planId as planIdFor, rememberPhoto, somedayId, threadId as threadIdFor, userId } from '@/lib/api/directory';
import { auth, catalog, groups as groupsApi, media as mediaApi, plans as plansApi, social, threads as threadsApi } from '@/lib/api/endpoints';
import { hydrateFromApi, loadJournal } from '@/lib/api/sync';
import { reportError } from '@/lib/monitoring';
import { WANT_BY_ID, WANT_BY_SLUG } from '@/lib/somedays';
import { useApp, type Party, type Visibility } from '@/store';
import { toast } from 'sonner-native';

/**
 * What the app does, as opposed to what the store holds.
 *
 * Screens call these instead of the store's setters. The store still applies
 * every change immediately - the app has always felt instant and losing that
 * to a round trip would be a bad trade - and the server is told afterwards. If
 * the server disagrees, the optimistic state is not patched up by hand but
 * refetched: guessing at the inverse of a half-applied change is how stores
 * end up quietly wrong, and the truth is one request away.
 *
 * In demo mode every one of these is just the store setter; `sync` is a no-op.
 */

const isLive = () => hasApi && useApp.getState().source === 'api';

/** Fire and forget, but never silently: a rejected write refetches and says so. */
function sync(run: () => Promise<unknown>, failure: string): void {
  if (!isLive()) return;
  void run().catch(() => {
    toast(i18n.t(failure));
    void hydrateFromApi().catch(() => {});
  });
}

/** The server's id for a someday the store knows by its own id. */
function somedayUuid(wantId: string): string | undefined {
  // A server someday whose slug the app bundles is stored under the bundled
  // want's own id (`wantIdForSlug`), not its slug - so look the want up by id
  // to get back to the slug the directory is keyed by. Looking it up by slug
  // alone found nothing, and every write for it (keep, lock, pass...) was
  // silently skipped: a locked plan lived only on the phone.
  const slug = WANT_BY_SLUG.get(wantId)?.slug ?? WANT_BY_ID.get(wantId)?.slug ?? wantId;
  return somedayId(slug) ?? somedayId(wantId);
}

/**
 * The same as `sync`, for writes that need the server's id for a someday.
 *
 * The id can be missing, and what used to happen then was nothing: every call
 * site read `if (id) sync(...)`, so a someday the directory had never heard of
 * was written to the store and never to the server. It looks exactly like
 * success - the card moves, the toast appears - and the keep is gone at the
 * next sign-in.
 *
 * That shipped twice. Onboarding's twelve starter picks came from the bundled
 * sample, and the person screen listed bundled somedays under real names; both
 * kept ids no directory could resolve. Both are fixed at the source, and this
 * exists so the third one is loud instead of silent.
 */
function syncResolved(
  kind: string,
  key: string,
  resolve: (key: string) => string | undefined,
  run: (id: string) => Promise<unknown>,
  failure: string,
): void {
  if (!isLive()) return;
  const id = resolve(key);
  if (!id) {
    reportError(new Error(`${kind} has no server id`), { kind, key, action: failure });
    toast(i18n.t(failure));
    // The directory is behind, not wrong - refetching is what repairs it.
    void hydrateFromApi().catch(() => {});
    return;
  }
  sync(() => run(id), failure);
}

const syncSomeday = (wantId: string, run: (id: string) => Promise<unknown>, failure: string) =>
  syncResolved('someday', wantId, somedayUuid, run, failure);
const syncPerson = (name: string, run: (id: string) => Promise<unknown>, failure: string) =>
  syncResolved('person', name, userId, run, failure);
const syncPlan = (wantId: string, run: (id: string) => Promise<unknown>, failure: string) =>
  syncResolved('plan', wantId, planIdFor, run, failure);
const syncPhoto = (url: string, run: (id: string) => Promise<unknown>, failure: string) =>
  syncResolved('photo', url, photoIdFor, run, failure);

const visibilityBody = (visibility: Visibility) => ({
  open_to: visibility.openTo,
  party_as: visibility.as,
});

export function keep(wantId: string, visibility?: Visibility): void {
  const state = useApp.getState();
  state.keep(wantId, visibility);
  const applied = visibility ?? state.defaultVisibility;
  syncSomeday(wantId, (id) => catalog.keep(id, visibilityBody(applied)), 's.toasts.syncFailed');
}

export function unkeep(wantId: string): void {
  useApp.getState().unkeep(wantId);
  syncSomeday(wantId, (id) => catalog.unkeep(id), 's.toasts.syncFailed');
}

export function pass(wantId: string): void {
  useApp.getState().pass(wantId);
  syncSomeday(wantId, (id) => catalog.pass(id), 's.toasts.syncFailed');
}

export function unpass(wantId: string): void {
  useApp.getState().unpass(wantId);
  syncSomeday(wantId, (id) => catalog.unpass(id), 's.toasts.syncFailed');
}

export function setVisibility(wantId: string, visibility: Visibility): void {
  useApp.getState().setVisibility(wantId, visibility);
  syncSomeday(wantId, (id) => catalog.setVisibility(id, visibilityBody(visibility)), 's.toasts.syncFailed');
}

/**
 * Write a someday the catalog does not have.
 *
 * Unlike every other action here this one cannot be optimistic in the usual
 * way: the row does not exist yet, so there is no server id to write against
 * and nothing to reconcile to if the call fails. It therefore awaits, and the
 * caller shows the result. Demo builds keep the local-only behaviour.
 *
 * Returns the id the rest of the app should use for it, or null when the write
 * failed and the caller should say so rather than pretend.
 */
export async function createSomeday(
  title: string,
  category: string,
  visibility?: Visibility,
): Promise<string | null> {
  const applied = visibility ?? useApp.getState().defaultVisibility;
  const { registerWant, wantFromDto } = await import('@/lib/registry');
  const { WANTS } = await import('@/lib/mock');

  if (!isLive()) {
    // Demo builds have no server to own the row, so it lives in the registry -
    // which exists for exactly this: somedays this build did not ship.
    const id = `custom-${Date.now()}`;
    registerWant(
      wantFromDto(
        { id, slug: null, title, category, party: 'any', needs: [], artwork_url: null },
        WANTS[0].photo,
      ),
    );
    useApp.getState().keep(id, applied);
    return id;
  }

  try {
    const kept = await catalog.create({ title, category, ...visibilityBody(applied) });
    const { rememberSomeday } = await import('@/lib/api/directory');
    rememberSomeday(kept.someday);
    const want = wantFromDto(kept.someday, WANTS[0].photo);
    registerWant(want);
    useApp.getState().keep(want.id, applied);
    return want.id;
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    return null;
  }
}

export async function acceptInvite(inviteId: string): Promise<{ id: string } | null> {
  if (!isLive()) return useApp.getState().acceptInvite(inviteId);
  try {
    const accepted = await social.acceptInvite(inviteId);
    await hydrateFromApi();
    return { id: accepted.thread_id };
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    return null;
  }
}

export function declineInvite(inviteId: string): void {
  useApp.getState().declineInvite(inviteId);
  sync(() => social.declineInvite(inviteId), 's.toasts.syncFailed');
}

export function markInvitesSeen(): void {
  useApp.getState().markInvitesSeen();
  sync(() => social.markInvitesSeen(), 's.toasts.syncFailed');
}

export function hidePerson(name: string): void {
  useApp.getState().hidePerson(name);
  syncPerson(name, (id) => social.hide(id), 's.toasts.syncFailed');
}

export function unhidePerson(name: string): void {
  useApp.getState().unhidePerson(name);
  syncPerson(name, (id) => social.unhide(id), 's.toasts.syncFailed');
}

/**
 * Report a person. Server-only: there is nothing in the store to change, and
 * the person being reported must never see a difference.
 *
 * The sheet confirms as soon as this returns, which is honest - the
 * confirmation is that the report was sent, not that anyone has acted on it.
 * In demo mode `sync` is a no-op and the confirmation is the whole behaviour.
 */
export function reportPerson(name: string, reason: string): void {
  syncPerson(name, (id) => social.report(id, reason), 's.toasts.syncFailed');
}

export function requestFriend(name: string): void {
  useApp.getState().requestFriend(name);
  syncPerson(name, (id) => social.requestFriend(id), 's.toasts.syncFailed');
}

export function acceptRequest(name: string): void {
  useApp.getState().acceptRequest(name);
  syncPerson(name, (id) => social.acceptFriend(id), 's.toasts.syncFailed');
}

export function declineRequest(name: string): void {
  useApp.getState().declineRequest(name);
  syncPerson(name, (id) => social.declineFriend(id), 's.toasts.syncFailed');
}

export async function createGroup(name: string): Promise<string | null> {
  if (!isLive()) return useApp.getState().createGroup(name);
  try {
    const group = await groupsApi.create(name);
    await hydrateFromApi();
    return group.id;
  } catch (cause) {
    // Creating a group is a Plus feature: the server says 402, and that is an
    // offer to make, not a failure to report. It used to read "that did not save".
    if ((cause as { needsPlus?: boolean } | null)?.needsPlus) {
      toast(i18n.t('s.toasts.groupsNeedPlus'), {
        action: {
          label: i18n.t('s.toasts.seePlus'),
          onClick: () => { void import('expo-router').then(({ router }) => router.push('/plus' as never)); },
        },
      });
      return null;
    }
    toast(i18n.t('s.toasts.syncFailed'));
    return null;
  }
}

export async function joinGroup(token: string): Promise<{ id: string } | null> {
  if (!isLive()) return useApp.getState().joinGroup(token) ?? null;
  try {
    const group = await groupsApi.join(token);
    await hydrateFromApi();
    return { id: group.id };
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    return null;
  }
}

export function leaveGroup(groupId: string): void {
  useApp.getState().leaveGroup(groupId);
  sync(() => groupsApi.leave(groupId), 's.toasts.syncFailed');
}

export function sendMessage(threadId: string, body: string, attachment?: Parameters<ReturnType<typeof useApp.getState>['sendMessage']>[2]): void {
  useApp.getState().sendMessage(threadId, body, attachment);
  sync(
    () => threadsApi.send(threadId, {
      body,
      attachment: attachment
        ? { type: attachment.type, ref: attachment.refId, label: attachment.label }
        : null,
    }),
    's.toasts.syncFailed',
  );
}

export function markThreadRead(threadId: string): void {
  useApp.getState().markThreadRead(threadId);
  sync(() => threadsApi.markRead(threadId), 's.toasts.syncFailed');
}

export async function openThread(kind: 'solo' | 'group' | 'plan', refId: string, title: string, wantId?: string): Promise<{ id: string } | null> {
  if (!isLive()) return useApp.getState().openThread(kind, refId, title, wantId);
  const known = threadIdFor(refId);
  if (known) return { id: known };
  try {
    if (kind === 'solo') {
      const id = userId(refId);
      if (!id) throw new Error('Unknown person');
      const thread = await threadsApi.openSolo(id);
      await hydrateFromApi();
      return { id: thread.id };
    }
    await hydrateFromApi();
    return useApp.getState().threads.find((thread) => thread.kind === kind && thread.refId === refId) ?? null;
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    return null;
  }
}

export function lock(plan: Parameters<ReturnType<typeof useApp.getState>['lock']>[0]): void {
  useApp.getState().lock(plan);
  if (!isLive()) return;
  const id = somedayUuid(plan.wantId);
  if (!id) return;
  void plansApi
    .lock({
      someday_id: id,
      date: plan.date,
      time_slot: plan.time ?? null,
      place: plan.place ?? null,
      place_id: plan.placeId ?? null,
      people: plan.people.map((name) => userId(name)).filter((value): value is string => Boolean(value)),
      split: plan.split,
    })
    // Locking creates the plan thread server-side, so the world is refetched
    // rather than guessed at.
    .then(() => hydrateFromApi())
    .catch(() => {
      toast(i18n.t('s.toasts.syncFailed'));
      void hydrateFromApi().catch(() => {});
    });
}

export function updatePlan(wantId: string, patch: Partial<Parameters<ReturnType<typeof useApp.getState>['lock']>[0]>): void {
  useApp.getState().updatePlan(wantId, patch);
  const id = planIdFor(wantId);
  if (!id) return;
  sync(
    () => plansApi.update(id, {
      ...(patch.date ? { date: patch.date } : {}),
      ...(patch.time !== undefined ? { time_slot: patch.time ?? null } : {}),
      ...(patch.place !== undefined ? { place: patch.place ?? null } : {}),
      ...(patch.split ? { split: patch.split } : {}),
      ...(patch.people
        ? { people: patch.people.map((name) => userId(name)).filter((v): v is string => Boolean(v)) }
        : {}),
    }),
    's.toasts.syncFailed',
  );
}

export function unlock(wantId: string): void {
  useApp.getState().unlock(wantId);
  syncPlan(wantId, (id) => plansApi.unlock(id), 's.toasts.syncFailed');
}

export function markDone(wantId: string): void {
  useApp.getState().markDone(wantId);
  syncPlan(wantId, (id) => plansApi.markDone(id), 's.toasts.syncFailed');
}

export async function addJournal(entry: Parameters<ReturnType<typeof useApp.getState>['addJournal']>[0]): Promise<boolean> {
  if (!isLive()) { useApp.getState().addJournal(entry); return true; }
  try {
    const id = somedayUuid(entry.wantId);
    if (!id) throw new Error('Unknown someday');
    const { uploadImage } = await import('@/lib/api/media');
    const key = entry.photo ? await uploadImage(entry.photo) : null;
    const saved = await plansApi.addJournal(id, { body: entry.body, photo_key: key });
    useApp.getState().addJournal({ ...entry, photo: saved.photo_url ?? undefined });
    await loadJournal(entry.wantId).catch(() => {});
    return true;
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    return false;
  }
}

export async function updateProfile(patch: Parameters<ReturnType<typeof useApp.getState>['updateProfile']>[0]): Promise<boolean> {
  useApp.getState().updateProfile(patch);
  if (!isLive()) return true;
  // Only the fields the server accepts; name, birthday and gender are fixed at
  // sign-up and are not in ProfilePatch at all.
  const body = {
    ...(patch.city !== undefined ? { city: patch.city } : {}),
    ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
    ...(patch.work !== undefined ? { work: patch.work } : {}),
    ...(patch.education !== undefined ? { education: patch.education } : {}),
    ...(patch.interests !== undefined ? { interests: patch.interests } : {}),
    ...(patch.hometown !== undefined ? { hometown: patch.hometown } : {}),
    ...(patch.languages !== undefined ? { languages: patch.languages } : {}),
    ...(patch.religion !== undefined ? { religion: patch.religion } : {}),
    ...(patch.politics !== undefined ? { politics: patch.politics } : {}),
  };
  if (Object.keys(body).length === 0) return true;
  try {
    await auth.updateMe(body);
    return true;
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    await hydrateFromApi().catch(() => {});
    return false;
  }
}

/** The other direction of the invite: you ask them. */
export async function askPerson(name: string, wantId: string, label: string, party: Party): Promise<boolean> {
  if (!isLive()) { useApp.getState().askPerson(name, wantId, label, party); return true; }
  const to = userId(name);
  const someday = somedayUuid(wantId);
  try {
    if (!to || !someday) throw new Error('Unknown invite target');
    await social.invite({ to_user_id: to, someday_id: someday, party });
    return true;
  } catch {
    toast(i18n.t('s.toasts.syncFailed'));
    return false;
  }
}

/**
 * A photograph, added optimistically.
 *
 * The local URI goes into the store immediately so the grid fills the moment
 * the picker closes, and is swapped for the served URL once the object store
 * has it. A failure removes that one photo rather than re-fetching the world -
 * the person is looking straight at it, and a photo quietly vanishing is
 * clearer than a whole screen blinking.
 */
export async function addProfilePhoto(uri: string): Promise<boolean> {
  const before = useApp.getState().profile.photos;
  useApp.getState().updateProfile({ photos: [...before, uri] });
  if (!isLive()) return true;
  try {
    const { uploadPhoto } = await import('@/lib/api/media');
    const photo = await uploadPhoto(uri);
    rememberPhoto(photo.url, photo.id);
    useApp.setState((state) => ({
      profile: {
        ...state.profile,
        photos: state.profile.photos.map((item) => (item === uri ? photo.url : item)),
      },
    }));
    return true;
  } catch {
    useApp.setState((state) => ({
      profile: { ...state.profile, photos: state.profile.photos.filter((item) => item !== uri) },
    }));
    toast(i18n.t('s.toasts.photoFailed'));
    return false;
  }
}

export function removeProfilePhoto(url: string): void {
  useApp.setState((state) => ({
    profile: { ...state.profile, photos: state.profile.photos.filter((item) => item !== url) },
  }));
  syncPhoto(url, (id) => mediaApi.deletePhoto(id), 's.toasts.syncFailed');
}

export function makePhotoFirst(url: string): void {
  useApp.setState((state) => ({
    profile: {
      ...state.profile,
      photos: [url, ...state.profile.photos.filter((item) => item !== url)],
    },
  }));
  syncPhoto(url, (id) => mediaApi.makeFirst(id), 's.toasts.syncFailed');
}

/** Really delete it. The confirmation has always said so; now it is true. */
export async function deleteAccount(): Promise<void> {
  if (isLive()) await auth.deleteMe();
}
