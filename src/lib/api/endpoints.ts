import { request, setTokens } from './client';
import type {
  CatalogPage,
  FeedOut,
  FriendsOut,
  GroupOut,
  InviteCreate,
  InviteOut,
  JournalIn,
  JournalOut,
  KeepOut,
  LoginIn,
  MessageIn,
  MessageOut,
  PersonOut,
  PhotoOut,
  PlaceOut,
  PlanCreate,
  PlanOut,
  PlanPatch,
  PresignUploadIn,
  PresignUploadOut,
  ProfileOut,
  ProfilePatch,
  RegisterIn,
  ThreadDetailOut,
  ThreadOut,
  TokenPair,
  Uuid,
  VisibilityIn,
} from './schema';

/**
 * Every route Gora API v2 serves, one function each, named for what it does
 * rather than for its verb and path. Nothing here decides anything - if a call
 * needs a policy, the policy belongs to the caller.
 */

export const auth = {
  register: async (body: RegisterIn) => {
    const pair = await request<TokenPair>('/auth/register', { method: 'POST', body, anonymous: true });
    await setTokens(pair);
    return pair;
  },
  login: async (body: LoginIn) => {
    const pair = await request<TokenPair>('/auth/login', { method: 'POST', body, anonymous: true });
    await setTokens(pair);
    return pair;
  },
  /**
   * Ends the session on both sides.
   *
   * Dropping the tokens locally is what this used to do, and it is enough
   * right up until the device is not the problem. The server call bumps the
   * account's token version, which reaches the refresh token someone else
   * copied - the only thing that can, under a stateless scheme.
   *
   * The local half runs regardless: being unable to reach the server must
   * never leave someone signed in on the phone in their hand.
   */
  signOut: async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } catch {
      // Offline, or a token already spent. Either way the device still clears.
    }
    await setTokens(null);
  },
  me: () => request<ProfileOut>('/auth/me'),
  updateMe: (body: ProfilePatch) => request<ProfileOut>('/auth/me', { method: 'PATCH', body }),
  deleteMe: () => request<void>('/auth/me', { method: 'DELETE' }),
  forgotPassword: (email: string) => request<void>('/auth/password/forgot', { method: 'POST', body: { email }, anonymous: true }),
  resetPassword: (token: string, password: string) =>
    request<TokenPair>('/auth/password/reset', { method: 'POST', body: { token, password }, anonymous: true }),
  /** Anonymous: the link is opened from an inbox, often not on this device. */
  verifyEmail: (token: string) =>
    request<ProfileOut>('/auth/email/verify', { method: 'POST', body: { token }, anonymous: true }),
  resendVerification: (email: string) =>
    request<void>('/auth/email/resend', { method: 'POST', body: { email }, anonymous: true }),
};

export const catalog = {
  /** One page of the browse grid, alphabetical. Pass the previous page's
   *  `next_offset` to continue; it is null when there is no more. */
  list: (params: { q?: string; category?: string; offset?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.offset) query.set('offset', String(params.offset));
    if (params.limit) query.set('limit', String(params.limit));
    const suffix = query.toString();
    return request<CatalogPage>(suffix ? `/catalog?${suffix}` : '/catalog');
  },
  /** The filter chips, served so the client and the catalog cannot drift. */
  categories: () => request<string[]>('/categories'),
  /**
   * The deck: the next cards for this person, ranked and spread.
   *
   * Deliberately has no cursor. The pool is "everything you have not decided
   * on" and it shrinks as you swipe, so an offset would skip whatever left the
   * pool while page one was on screen. Deciding is what advances the deck.
   */
  feed: (params: { limit?: number; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.category) query.set('category', params.category);
    const suffix = query.toString();
    return request<FeedOut>(suffix ? `/feed?${suffix}` : '/feed');
  },
  mine: () => request<KeepOut[]>('/me/somedays'),
  keep: (somedayId: Uuid, body: VisibilityIn) => request<KeepOut>(`/somedays/${somedayId}/keep`, { method: 'PUT', body }),
  unkeep: (somedayId: Uuid) => request<void>(`/somedays/${somedayId}/keep`, { method: 'DELETE' }),
  pass: (somedayId: Uuid) => request<void>(`/somedays/${somedayId}/pass`, { method: 'PUT' }),
  unpass: (somedayId: Uuid) => request<void>(`/somedays/${somedayId}/pass`, { method: 'DELETE' }),
  setVisibility: (somedayId: Uuid, body: VisibilityIn) => request<KeepOut>(`/somedays/${somedayId}/visibility`, { method: 'PUT', body }),
  holders: (somedayId: Uuid) => request<PersonOut[]>(`/somedays/${somedayId}/holders`),
};

export const social = {
  invites: () => request<InviteOut[]>('/invites'),
  invite: (body: InviteCreate) => request<InviteOut>('/invites', { method: 'POST', body }),
  /**
   * Accepting opens the conversation and returns only its id - not the thread.
   * Typed as ThreadOut until a simulation run against the live API showed the
   * body is `{thread_id}`; harmless so far only because the one caller discards
   * the result, which is exactly the kind of lie that bites the second caller.
   */
  acceptInvite: (inviteId: Uuid) =>
    request<{ thread_id: Uuid }>(`/invites/${inviteId}/accept`, { method: 'POST' }),
  declineInvite: (inviteId: Uuid) => request<void>(`/invites/${inviteId}/decline`, { method: 'POST' }),
  markInvitesSeen: () => request<void>('/invites/seen', { method: 'POST' }),
  friends: () => request<FriendsOut>('/friends'),
  requestFriend: (userId: Uuid) => request<void>(`/friends/${userId}/request`, { method: 'POST' }),
  acceptFriend: (userId: Uuid) => request<void>(`/friends/${userId}/accept`, { method: 'POST' }),
  declineFriend: (userId: Uuid) => request<void>(`/friends/${userId}/decline`, { method: 'POST' }),
  hidden: () => request<PersonOut[]>('/hidden'),
  hide: (userId: Uuid) => request<void>(`/hidden/${userId}`, { method: 'PUT' }),
  unhide: (userId: Uuid) => request<void>(`/hidden/${userId}`, { method: 'DELETE' }),
  person: (handle: string) => request<PersonOut>(`/people/${encodeURIComponent(handle)}`),
  report: (userId: Uuid, reason: string) => request<void>(`/people/${userId}/report`, { method: 'POST', body: { reason } }),
};

export const groups = {
  list: () => request<GroupOut[]>('/groups'),
  create: (name: string) => request<GroupOut>('/groups', { method: 'POST', body: { name } }),
  get: (groupId: Uuid) => request<GroupOut>(`/groups/${groupId}`),
  join: (token: string) => request<GroupOut>(`/groups/join/${encodeURIComponent(token)}`, { method: 'POST' }),
  leave: (groupId: Uuid) => request<void>(`/groups/${groupId}/membership`, { method: 'DELETE' }),
};

export const threads = {
  list: () => request<ThreadOut[]>('/threads'),
  openSolo: (userId: Uuid) => request<ThreadOut>(`/threads/solo/${userId}`, { method: 'POST' }),
  get: (threadId: Uuid) => request<ThreadDetailOut>(`/threads/${threadId}`),
  send: (threadId: Uuid, body: MessageIn) => request<MessageOut>(`/threads/${threadId}/messages`, { method: 'POST', body }),
  markRead: (threadId: Uuid) => request<void>(`/threads/${threadId}/read`, { method: 'POST' }),
};

export const plans = {
  list: () => request<PlanOut[]>('/plans'),
  lock: (body: PlanCreate) => request<PlanOut>('/plans', { method: 'POST', body }),
  update: (planId: Uuid, body: PlanPatch) => request<PlanOut>(`/plans/${planId}`, { method: 'PATCH', body }),
  unlock: (planId: Uuid) => request<void>(`/plans/${planId}`, { method: 'DELETE' }),
  markDone: (planId: Uuid) => request<PlanOut>(`/plans/${planId}/done`, { method: 'POST' }),
  journal: (somedayId: Uuid) => request<JournalOut[]>(`/somedays/${somedayId}/journal`),
  addJournal: (somedayId: Uuid, body: JournalIn) => request<JournalOut>(`/somedays/${somedayId}/journal`, { method: 'POST', body }),
};

export const media = {
  /** Two steps by design: presign, PUT the bytes straight to the store, then
   *  claim the key. The app never streams a photo through the API. */
  presign: (body: PresignUploadIn) => request<PresignUploadOut>('/media/presign', { method: 'POST', body }),
  claimPhoto: (key: string) => request<PhotoOut>('/media/photos', { method: 'POST', body: { key } }),
  deletePhoto: (photoId: Uuid) => request<void>(`/media/photos/${photoId}`, { method: 'DELETE' }),
  makeFirst: (photoId: Uuid) => request<void>(`/media/photos/${photoId}/first`, { method: 'POST' }),
};

export const places = {
  /**
   * `session` groups one search's keystrokes into a single billable session at
   * the provider. Without it every debounced request is priced on its own, so
   * it is a cost control rather than a correctness one - but it is the whole
   * difference between one charge per search and one per keystroke.
   */
  search: (query: string, session?: string) =>
    request<PlaceOut[]>(
      `/places/search?q=${encodeURIComponent(query)}${session ? `&session=${encodeURIComponent(session)}` : ''}`,
    ),
};

export const ops = {
  health: () => request<Record<string, string>>('/health', { anonymous: true }),
};
