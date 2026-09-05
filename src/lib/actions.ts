import { i18n } from '@/i18n';
import { hasApi } from '@/lib/api/client';
import { photoId as photoIdFor, planId as planIdFor, somedayId, threadId as threadIdFor, userId } from '@/lib/api/directory';
import { auth, catalog, groups as groupsApi, media as mediaApi, plans as plansApi, social, threads as threadsApi } from '@/lib/api/endpoints';
import { hydrateFromApi } from '@/lib/api/sync';
import { WANT_BY_SLUG } from '@/lib/somedays';
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
  const slug = WANT_BY_SLUG.get(wantId)?.slug ?? wantId;
  return somedayId(slug) ?? somedayId(wantId);
}

const visibilityBody = (visibility: Visibility) => ({
  open_to: visibility.openTo,
  party_as: visibility.as,
});

export function keep(wantId: string, visibility?: Visibility): void {
  const state = useApp.getState();
  state.keep(wantId, visibility);
  const id = somedayUuid(wantId);
  const applied = visibility ?? state.defaultVisibility;
  if (id) sync(() => catalog.keep(id, visibilityBody(applied)), 's.toasts.syncFailed');
}

export function unkeep(wantId: string): void {
  useApp.getState().unkeep(wantId);
  const id = somedayUuid(wantId);
  if (id) sync(() => catalog.unkeep(id), 's.toasts.syncFailed');
}

export function pass(wantId: string): void {
  useApp.getState().pass(wantId);
  const id = somedayUuid(wantId);
  if (id) sync(() => catalog.pass(id), 's.toasts.syncFailed');
}

export function unpass(wantId: string): void {
  useApp.getState().unpass(wantId);
  const id = somedayUuid(wantId);
  if (id) sync(() => catalog.unpass(id), 's.toasts.syncFailed');
}

export function setVisibility(wantId: string, visibility: Visibility): void {
  useApp.getState().setVisibility(wantId, visibility);
  const id = somedayUuid(wantId);
  if (id) sync(() => catalog.setVisibility(id, visibilityBody(visibility)), 's.toasts.syncFailed');
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

export function acceptInvite(inviteId: string) {
  const thread = useApp.getState().acceptInvite(inviteId);
  sync(() => social.acceptInvite(inviteId), 's.toasts.syncFailed');
  return thread;
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
  const id = userId(name);
  if (id) sync(() => social.hide(id), 's.toasts.syncFailed');
}

export function unhidePerson(name: string): void {
  useApp.getState().unhidePerson(name);
  const id = userId(name);
  if (id) sync(() => social.unhide(id), 's.toasts.syncFailed');
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
  const id = userId(name);
  if (id) sync(() => social.report(id, reason), 's.toasts.syncFailed');
}

export function requestFriend(name: string): void {
  useApp.getState().requestFriend(name);
  const id = userId(name);
  if (id) sync(() => social.requestFriend(id), 's.toasts.syncFailed');
}

export function acceptRequest(name: string): void {
  useApp.getState().acceptRequest(name);
  const id = userId(name);
  if (id) sync(() => social.acceptFriend(id), 's.toasts.syncFailed');
}

export function declineRequest(name: string): void {
  useApp.getState().declineRequest(name);
  const id = userId(name);
  if (id) sync(() => social.declineFriend(id), 's.toasts.syncFailed');
}

export function createGroup(name: string): string {
  const localId = useApp.getState().createGroup(name);
  // The server allocates the real id and token, so the optimistic row is
  // replaced wholesale rather than reconciled.
  if (isLive()) {
    void groupsApi
      .create(name)
      .then(() => hydrateFromApi())
      .catch(() => {
        toast(i18n.t('s.toasts.syncFailed'));
        void hydrateFromApi().catch(() => {});
      });
  }
  return localId;
}

export function joinGroup(token: string) {
  const group = useApp.getState().joinGroup(token);
  if (isLive()) {
    void groupsApi.join(token).then(() => hydrateFromApi()).catch(() => {
      toast(i18n.t('s.toasts.syncFailed'));
    });
  }
  return group;
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

export function openThread(kind: 'solo' | 'group' | 'plan', refId: string, title: string, wantId?: string) {
  const thread = useApp.getState().openThread(kind, refId, title, wantId);
  // A duo thread may not exist server-side yet; asking for it is what creates it.
  if (isLive() && kind === 'solo' && !threadIdFor(refId)) {
    const id = userId(refId);
    if (id) {
      void threadsApi.openSolo(id).then(() => hydrateFromApi()).catch(() => {});
    }
  }
  return thread;
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
  const id = planIdFor(wantId);
  useApp.getState().unlock(wantId);
  if (id) sync(() => plansApi.unlock(id), 's.toasts.syncFailed');
}

export function markDone(wantId: string): void {
  const id = planIdFor(wantId);
  useApp.getState().markDone(wantId);
  if (id) sync(() => plansApi.markDone(id), 's.toasts.syncFailed');
}

export function addJournal(entry: Parameters<ReturnType<typeof useApp.getState>['addJournal']>[0]): void {
  useApp.getState().addJournal(entry);
  const id = somedayUuid(entry.wantId);
  if (id) sync(() => plansApi.addJournal(id, { body: entry.body }), 's.toasts.syncFailed');
}

export function updateProfile(patch: Parameters<ReturnType<typeof useApp.getState>['updateProfile']>[0]): void {
  useApp.getState().updateProfile(patch);
  if (!isLive()) return;
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
  if (Object.keys(body).length === 0) return;
  sync(() => auth.updateMe(body), 's.toasts.syncFailed');
}

/** The other direction of the invite: you ask them. */
export function askPerson(name: string, wantId: string, label: string, party: Party) {
  const thread = useApp.getState().askPerson(name, wantId, label, party);
  if (!isLive()) return thread;
  const to = userId(name);
  const someday = somedayUuid(wantId);
  if (to && someday) {
    void social.invite({ to_user_id: to, someday_id: someday, party })
      .then(() => hydrateFromApi())
      .catch(() => toast(i18n.t('s.toasts.syncFailed')));
  }
  return thread;
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
export async function addProfilePhoto(uri: string): Promise<void> {
  const before = useApp.getState().profile.photos;
  useApp.getState().updateProfile({ photos: [...before, uri] });
  if (!isLive()) return;
  try {
    const { uploadPhoto } = await import('@/lib/api/media');
    const photo = await uploadPhoto(uri);
    useApp.setState((state) => ({
      profile: {
        ...state.profile,
        photos: state.profile.photos.map((item) => (item === uri ? photo.url : item)),
      },
    }));
  } catch {
    useApp.setState((state) => ({
      profile: { ...state.profile, photos: state.profile.photos.filter((item) => item !== uri) },
    }));
    toast(i18n.t('s.toasts.photoFailed'));
  }
}

export function removeProfilePhoto(url: string): void {
  useApp.setState((state) => ({
    profile: { ...state.profile, photos: state.profile.photos.filter((item) => item !== url) },
  }));
  const id = photoIdFor(url);
  if (id) sync(() => mediaApi.deletePhoto(id), 's.toasts.syncFailed');
}

export function makePhotoFirst(url: string): void {
  useApp.setState((state) => ({
    profile: {
      ...state.profile,
      photos: [url, ...state.profile.photos.filter((item) => item !== url)],
    },
  }));
  const id = photoIdFor(url);
  if (id) sync(() => mediaApi.makeFirst(id), 's.toasts.syncFailed');
}

/** Really delete it. The confirmation has always said so; now it is true. */
export async function deleteAccount(): Promise<void> {
  if (isLive()) await auth.deleteMe();
}
