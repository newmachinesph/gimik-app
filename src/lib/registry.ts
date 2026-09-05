import type { PersonOut, HolderOut, SomedayOut } from '@/lib/api/schema';
import type { Want } from '@/lib/mock';
import type { Person } from '@/lib/people';

/**
 * What the server told us about people and somedays we did not ship.
 *
 * The bundled catalogue is a sample, not the whole 522, and the seeded cast is
 * nine people - so any real account will reference things this build has never
 * heard of. Rather than render a blank row, the boundary registers them here
 * and the existing lookups consult it. Bundled data still wins: it carries the
 * authored photograph, note and taste that the wire shapes do not have.
 *
 * Runtime only, never persisted: it is a cache of the last thing the server
 * said, and a stale copy is worse than a refetch.
 */

const wants = new Map<string, Want>();
const people = new Map<string, Person>();

export function registerWant(want: Want): void {
  if (!wants.has(want.id)) wants.set(want.id, want);
}

export function registerPerson(person: Person): void {
  people.set(person.name, person);
}

export const registeredWant = (id: string) => wants.get(id);
export const registeredPerson = (name: string) => people.get(name);
export const registeredWants = () => [...wants.values()];
export const registeredPeople = () => [...people.values()];

export function resetRegistry(): void {
  wants.clear();
  people.clear();
}

/** A someday the server knows and this build does not. */
export function wantFromDto(dto: SomedayOut, fallbackPhoto: Want['photo']): Want {
  return {
    // The slug is the stable, readable identity; a UUID in a route would make
    // every deep link opaque. Slugless custom somedays fall back to their id.
    id: dto.slug ?? dto.id,
    slug: dto.slug ?? undefined,
    title: dto.title,
    category: dto.category as Want['category'],
    party: dto.party as Want['party'],
    needs: dto.needs,
    photo: dto.artwork_url ?? fallbackPhoto,
    saves: 0,
    register: 'project',
  };
}

/** A person the server knows and this build does not. */
export function personFromDto(dto: HolderOut | PersonOut, id: string): Person {
  const full = dto as PersonOut;
  return {
    id,
    name: dto.name,
    handle: dto.handle,
    gender: (dto.gender ?? 'nonbinary') as Person['gender'],
    age: 0,
    city: dto.city ?? '',
    bio: full.bio ?? '',
    work: full.work ?? '',
    education: full.education ?? '',
    hometown: full.hometown ?? '',
    languages: full.languages ?? [],
    leans: [],
    photoCount: full.photos?.length ?? 0,
  };
}
