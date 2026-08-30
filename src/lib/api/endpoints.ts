import { request, setTokens } from './client';
import type {
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
  SomedayOut,
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
  /** Local only: the server has no session to end. */
  signOut: () => setTokens(null),
  me: () => request<ProfileOut>('/auth/me'),
  updateMe: (body: ProfilePatch) => request<ProfileOut>('/auth/me', { method: 'PATCH', body }),
  deleteMe: () => request<void>('/auth/me', { method: 'DELETE' }),
  forgotPassword: (email: string) => request<void>('/auth/password/forgot', { method: 'POST', body: { email }, anonymous: true }),
  resetPassword: (token: string, password: string) =>
    request<TokenPair>('/auth/password/reset', { method: 'POST', body: { token, password }, anonymous: true }),
};

export const catalog = {
  list: () => request<SomedayOut[]>('/catalog'),
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
  acceptInvite: (inviteId: Uuid) => request<ThreadOut>(`/invites/${inviteId}/accept`, { method: 'POST' }),
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
  search: (query: string) => request<PlaceOut[]>(`/places/search?q=${encodeURIComponent(query)}`),
};

export const ops = {
  health: () => request<Record<string, string>>('/health', { anonymous: true }),
};
