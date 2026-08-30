import { CATALOG_FALLBACK } from '@/lib/storage';
import { personFromDto, registerPerson, registerWant, wantFromDto } from '@/lib/registry';
import { wantIdForSlug } from '@/lib/somedays';
import type {
  Audience,
  FriendRequest,
  Group,
  Invite,
  JournalEntry,
  Message,
  Party,
  Plan,
  Profile,
  Thread,
  Visibility,
} from '@/store';
import { rememberPerson, rememberPhoto, rememberPlan, rememberSomeday, rememberThread } from './directory';
import type {
  FriendsOut,
  GroupOut,
  InviteOut,
  JournalOut,
  KeepOut,
  MessageOut,
  PersonOut,
  PlanOut,
  ProfileOut,
  SomedayOut,
  ThreadDetailOut,
  ThreadOut,
} from './schema';

/**
 * Wire shapes in, store shapes out.
 *
 * Every function here is pure apart from the two registrations it performs -
 * teaching the directory an id and the registry a someday or a person it did
 * not ship with. Those are idempotent and deliberately co-located: a DTO that
 * has been mapped has, by definition, been seen, and splitting "map" from
 * "remember" only creates a way to do one without the other.
 */

/** Remembering a someday is what lets the app open one it never bundled. */
function adoptSomeday(dto: SomedayOut): string {
  rememberSomeday(dto);
  const id = dto.slug ? wantIdForSlug(dto.slug) : dto.id;
  registerWant({ ...wantFromDto(dto, CATALOG_FALLBACK), id });
  return id;
}

function adoptPerson(dto: PersonOut | { id: string; name: string; handle: string; gender: string | null; city: string | null }): string {
  rememberPerson(dto as PersonOut);
  registerPerson(personFromDto(dto as PersonOut, dto.id));
  return dto.name;
}

export function toProfile(dto: ProfileOut): Profile {
  dto.photos.forEach((photo) => rememberPhoto(photo.url, photo.id));
  return {
    name: dto.name,
    handle: dto.handle,
    birthday: dto.birthday,
    gender: (dto.gender as Profile['gender']) ?? null,
    city: dto.city,
    bio: dto.bio,
    work: dto.work,
    education: dto.education,
    hometown: dto.hometown,
    interests: dto.interests,
    languages: dto.languages,
    religion: dto.religion,
    politics: dto.politics,
    // Ordered by the server; position 0 is the face everywhere.
    photos: [...dto.photos].sort((a, b) => a.position - b.position).map((photo) => photo.url),
  };
}

export function toKeeps(dtos: KeepOut[]): {
  keptIds: string[];
  keptAt: Record<string, string>;
  visibility: Record<string, Visibility>;
} {
  const keptIds: string[] = [];
  const keptAt: Record<string, string> = {};
  const visibility: Record<string, Visibility> = {};
  for (const dto of dtos) {
    const id = adoptSomeday(dto.someday);
    keptIds.push(id);
    keptAt[id] = dto.kept_at;
    visibility[id] = { openTo: dto.open_to as Audience[], as: dto.party_as as Party[] };
  }
  return { keptIds, keptAt, visibility };
}

export function toInvites(dtos: InviteOut[]): Invite[] {
  return dtos.map((dto) => ({
    id: dto.id,
    from: adoptPerson(dto.from_user),
    wantId: adoptSomeday(dto.someday),
    party: dto.party as Party,
    at: dto.created_at,
    status: dto.status as Invite['status'],
  }));
}

export function toFriends(dto: FriendsOut): {
  friends: string[];
  requests: FriendRequest[];
  sentRequests: string[];
} {
  return {
    friends: dto.friends.map(adoptPerson),
    requests: dto.requests.map((request) => ({
      from: adoptPerson(request.from_user),
      at: request.created_at,
    })),
    sentRequests: dto.sent.map(adoptPerson),
  };
}

/**
 * People this account has hidden, as the names the store keys them by.
 *
 * Hiding was a one-way write before this existed: `hide` and `unhide` reached
 * the server, but nothing ever read the list back, so hiding someone on one
 * phone left them visible on every other.
 */
export function toHidden(dtos: PersonOut[]): string[] {
  return dtos.map(adoptPerson);
}

export function toGroups(dtos: GroupOut[], me: string): Group[] {
  return dtos.map((dto) => ({
    id: dto.id,
    name: dto.name,
    inviteToken: dto.invite_token,
    // The store writes the signed-in person as the literal 'me'.
    members: dto.members.map((member) => (member.name === me ? 'me' : adoptPerson(member))),
    createdAt: dto.created_at,
  }));
}

function toMessage(dto: MessageOut, me: string): Message {
  return {
    id: dto.id,
    from: dto.sender.name === me ? 'me' : adoptPerson(dto.sender),
    body: dto.body,
    at: dto.created_at,
    attachment: dto.attachment
      ? {
          type: dto.attachment.type as NonNullable<Message['attachment']>['type'],
          refId: dto.attachment.ref,
          label: dto.attachment.label,
        }
      : undefined,
  };
}

export function toThread(dto: ThreadOut | ThreadDetailOut, me: string): Thread {
  const wantId = dto.someday ? adoptSomeday(dto.someday) : undefined;
  // What the store calls a thread's subject differs by kind: a person for a
  // duo, the group for a group, the someday for a plan.
  const other = dto.participants.find((person) => person.name !== me);
  const refId =
    dto.kind === 'group'
      ? dto.group_id ?? dto.id
      : dto.kind === 'plan'
        ? wantId ?? dto.id
        : other
          ? adoptPerson(other)
          : dto.title;
  rememberThread(refId, dto.id);
  const messages = 'messages' in dto
    ? dto.messages.map((message) => toMessage(message, me))
    : dto.last_message
      ? [toMessage(dto.last_message, me)]
      : [];
  return {
    id: dto.id,
    kind: dto.kind as Thread['kind'],
    refId,
    title: dto.kind === 'solo' && other ? other.name : dto.title,
    messages,
    // The wire says "unread", the store keeps a watermark. An unread thread has
    // no watermark past its last message; a read one is caught up as of now.
    readAt: dto.unread ? null : new Date().toISOString(),
    wantId,
  };
}

export const toThreads = (dtos: ThreadOut[], me: string) => dtos.map((dto) => toThread(dto, me));

export function toPlans(dtos: PlanOut[], me: string): {
  plans: Record<string, Plan>;
  doneIds: string[];
  doneAt: Record<string, string>;
} {
  const plans: Record<string, Plan> = {};
  const doneIds: string[] = [];
  const doneAt: Record<string, string> = {};
  for (const dto of dtos) {
    const wantId = adoptSomeday(dto.someday);
    rememberPlan(wantId, dto.id);
    const people = dto.people.filter((person) => person.name !== me).map(adoptPerson);
    const confirmedNames = dto.people
      .filter((person) => dto.confirmed_ids.includes(person.id) && person.name !== me)
      .map((person) => person.name);
    plans[wantId] = {
      wantId,
      date: dto.date,
      time: dto.time_slot ?? undefined,
      people,
      place: dto.place ?? undefined,
      split: dto.split as Plan['split'],
      confirmed: confirmedNames,
    };
    if (dto.done_at) {
      doneIds.push(wantId);
      doneAt[wantId] = dto.done_at;
    }
  }
  return { plans, doneIds, doneAt };
}

export function toJournal(dtos: JournalOut[], wantIdOf: (somedayId: string) => string | undefined): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const dto of dtos) {
    const wantId = wantIdOf(dto.someday_id);
    // An entry for a someday this build cannot resolve has nowhere to render.
    if (!wantId) continue;
    entries.push({
      id: dto.id,
      wantId,
      body: dto.body,
      ...(dto.photo_url ? { photo: dto.photo_url } : {}),
      at: dto.created_at,
    });
  }
  return entries;
}

/** A person's full profile, for `person/[name]`. */
export function adoptPersonDetail(dto: PersonOut): string {
  dto.somedays.forEach(adoptSomeday);
  dto.in_common.forEach(adoptSomeday);
  return adoptPerson(dto);
}
