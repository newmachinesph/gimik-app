import type { HolderOut, PersonOut, SomedayOut, Uuid } from './schema';

/**
 * The translation table between the app's vocabulary and the server's.
 *
 * The app has always keyed people by name and somedays by slug, because in a
 * world with no server those *are* the identities. The API keys both by UUID.
 * Rather than widen every collection in the store - which would touch all
 * twenty-three screens to say nothing new - the boundary keeps a directory and
 * translates, so ids stay a transport concern and the screens keep reading the
 * vocabulary the corpus is written in.
 *
 * It is a plain module-level map rather than store state on purpose: it is
 * derived, never persisted, and rebuilt from whatever the server just said.
 */

const somedayIdBySlug = new Map<string, Uuid>();
const slugBySomedayId = new Map<Uuid, string>();
const userIdByName = new Map<string, Uuid>();
const nameByUserId = new Map<Uuid, string>();
// The store keys a plan by the someday it is for; the API gives the plan its
// own id. Updating one needs the second, so the boundary keeps both.
const planIdByWantId = new Map<string, Uuid>();
const threadIdByRef = new Map<string, Uuid>();
// The store holds photo URLs, but removing one needs the row's id.
const photoIdByUrl = new Map<string, Uuid>();

export function rememberSomeday(someday: SomedayOut): void {
  const key = someday.slug ?? someday.id;
  somedayIdBySlug.set(key, someday.id);
  slugBySomedayId.set(someday.id, key);
}

export function rememberPerson(person: HolderOut | PersonOut): void {
  userIdByName.set(person.name, person.id);
  nameByUserId.set(person.id, person.name);
}

export function rememberPlan(wantId: string, planId: Uuid): void {
  planIdByWantId.set(wantId, planId);
}

export function rememberPhoto(url: string, id: Uuid): void {
  photoIdByUrl.set(url, id);
}

export function rememberThread(refId: string, threadId: Uuid): void {
  threadIdByRef.set(refId, threadId);
}

export const planId = (wantId: string) => planIdByWantId.get(wantId);
export const threadId = (refId: string) => threadIdByRef.get(refId);
export const photoId = (url: string) => photoIdByUrl.get(url);
export const somedayId = (slug: string) => somedayIdBySlug.get(slug);
export const somedaySlug = (id: Uuid) => slugBySomedayId.get(id);
export const userId = (name: string) => userIdByName.get(name);
export const userName = (id: Uuid) => nameByUserId.get(id);

/** How many identities are known. A read path that mapped nothing is a bug. */
export function directorySize() {
  return { somedays: somedayIdBySlug.size, people: userIdByName.size };
}

export function resetDirectory(): void {
  somedayIdBySlug.clear();
  slugBySomedayId.clear();
  userIdByName.clear();
  nameByUserId.clear();
  planIdByWantId.clear();
  threadIdByRef.clear();
  photoIdByUrl.clear();
}
