/**
 * The wire shapes of Gora API v2, transcribed from `app/schemas.py`.
 *
 * Field names are the server's, snake_case and all: a DTO that renames as it
 * crosses the boundary hides drift, and this file's whole job is to fail
 * loudly in the type checker when the backend changes. Mapping these onto the
 * app's own vocabulary is the caller's business, not the transport's.
 */

export type Uuid = string;
/** `YYYY-MM-DD`. */
export type IsoDate = string;
/** RFC 3339, UTC. */
export type IsoDateTime = string;

export type TokenPair = { access_token: string; refresh_token: string; token_type: string };
export type RegisterIn = { email: string; password: string; name: string; birthday?: IsoDate | null; gender?: string | null };
export type LoginIn = { email: string; password: string };

export type PhotoOut = { id: Uuid; position: number; url: string };

export type ProfileOut = {
  id: Uuid;
  email?: string | null;
  /** Only ever populated for your own profile, alongside the address. */
  email_verified?: boolean;
  /** 'free' or 'plus'. Read to decide what to show, never what to allow. */
  tier?: 'free' | 'plus';
  plus_until?: IsoDateTime | null;
  name: string;
  handle: string;
  birthday: IsoDate | null;
  gender: string | null;
  city: string | null;
  bio: string;
  work: string;
  education: string;
  interests: string[];
  hometown: string | null;
  languages: string[];
  religion: string | null;
  politics: string | null;
  created_at: IsoDateTime;
  photos: PhotoOut[];
};

export type ProfilePatch = Partial<
  Pick<ProfileOut, 'city' | 'bio' | 'work' | 'education' | 'interests' | 'hometown' | 'languages' | 'religion' | 'politics'>
>;

export type SomedayOut = {
  id: Uuid;
  slug: string | null;
  title: string;
  category: string;
  /** The subcategory ("Hiking & Mountains"), finer than the filter chips. */
  domain?: string | null;
  /** "single" for nearly everything; anything else is chipped at over time. */
  completion?: string;
  target?: number | null;
  party: string;
  needs: string[];
  artwork_url?: string | null;
};

/**
 * One page of the browse grid. The catalog is 2,522 concepts now, so `/catalog`
 * pages instead of returning everything; `next_offset` is null on the last page.
 */
export type ProgressOut = {
  someday_id: Uuid;
  count: number;
  target: number | null;
  last_at: IsoDateTime | null;
  complete: boolean;
};

export type CatalogPage = { items: SomedayOut[]; total: number; next_offset: number | null };

/**
 * One deck card and why it was chosen. `reasons` carries tags the card can show
 * ("friends", "second_look"), which is both better product and the only way to
 * tell a mis-ranked deck from a working one without reading the server.
 */
export type FeedItemOut = {
  someday: SomedayOut;
  pool: string;
  reasons: string[];
  /** How many people hold this someday, and how many of them you know. */
  keeps: number;
  friend_keeps: number;
};

/** `exhausted` means every pool is empty - show an end state, do not refetch. */
export type FeedOut = { items: FeedItemOut[]; exhausted: boolean; pools: Record<string, number> };

/** The two visibility axes. `party_as` is `as` on the client; `as` is reserved in TS. */
export type VisibilityIn = { open_to: string[]; party_as: string[] };
export type KeepOut = { someday: SomedayOut; open_to: string[]; party_as: string[]; kept_at: IsoDateTime; progress?: ProgressOut | null };
export type HolderOut = { id: Uuid; name: string; handle: string; gender: string | null; city: string | null };

export type InviteCreate = { to_user_id: Uuid; someday_id: Uuid; party: string };
export type InviteOut = {
  id: Uuid;
  from_user: HolderOut;
  someday: SomedayOut;
  party: string;
  status: string;
  created_at: IsoDateTime;
};

export type FriendRequestOut = { id: Uuid; from_user: HolderOut; created_at: IsoDateTime };
export type FriendsOut = { friends: HolderOut[]; requests: FriendRequestOut[]; sent: HolderOut[] };

export type GroupOut = { id: Uuid; name: string; invite_token: string; members: HolderOut[]; created_at: IsoDateTime };

export type AttachmentIn = { type: string; ref: string; label: string };
export type MessageIn = { body: string; attachment?: AttachmentIn | null };
export type MessageOut = { id: Uuid; sender: HolderOut; body: string; attachment: AttachmentIn | null; created_at: IsoDateTime };

export type ThreadOut = {
  id: Uuid;
  kind: string;
  title: string;
  someday: SomedayOut | null;
  plan_id: Uuid | null;
  group_id: Uuid | null;
  participants: HolderOut[];
  last_message: MessageOut | null;
  unread: boolean;
  created_at: IsoDateTime;
};
export type ThreadDetailOut = ThreadOut & { messages: MessageOut[] };

export type PlaceOut = { id: Uuid; name: string; area: string; lat: number | null; lon: number | null };

export type PlanCreate = {
  someday_id: Uuid;
  date: IsoDate;
  time_slot?: string | null;
  place?: string | null;
  place_id?: Uuid | null;
  people?: Uuid[];
  split?: string;
};
export type PlanPatch = Partial<Omit<PlanCreate, 'someday_id'>>;
export type PlanOut = {
  id: Uuid;
  someday: SomedayOut;
  date: IsoDate;
  time_slot: string | null;
  place: string | null;
  place_id: Uuid | null;
  split: string;
  people: HolderOut[];
  confirmed_ids: Uuid[];
  done_at: IsoDateTime | null;
  thread_id: Uuid | null;
  created_at: IsoDateTime;
};

export type JournalIn = { body: string; photo_key?: string | null };
export type JournalOut = { id: Uuid; someday_id: Uuid; body: string; photo_url: string | null; created_at: IsoDateTime };

export type PresignUploadIn = { filename: string; content_type: string };
export type PresignUploadOut = { key: string; upload_url: string };

export type PersonOut = {
  id: Uuid;
  name: string;
  handle: string;
  gender: string | null;
  city: string | null;
  bio: string;
  work: string;
  education: string;
  interests: string[];
  hometown: string | null;
  languages: string[];
  created_at: IsoDateTime;
  photos: PhotoOut[];
  somedays: SomedayOut[];
  in_common: SomedayOut[];
  /** What they have actually done. The journal behind it stays private. */
  record?: SomedayOut[];
  is_friend: boolean;
  request_pending: boolean;
};
