import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocked before the module under test is imported, so `actions` binds to these.
vi.mock('@/lib/api/client', () => ({ hasApi: true }));

// `vi.mock` is hoisted above const declarations, so the doubles have to be
// created in a hoisted block or the factory closes over a dead binding.
const endpoints = vi.hoisted(() => ({
  auth: { updateMe: vi.fn().mockResolvedValue({}), deleteMe: vi.fn().mockResolvedValue(undefined) },
  catalog: {
    keep: vi.fn().mockResolvedValue({}),
    unkeep: vi.fn().mockResolvedValue(undefined),
    pass: vi.fn().mockResolvedValue(undefined),
    unpass: vi.fn().mockResolvedValue(undefined),
    setVisibility: vi.fn().mockResolvedValue({}),
  },
  social: {
    acceptInvite: vi.fn().mockResolvedValue({}),
    declineInvite: vi.fn().mockResolvedValue(undefined),
    markInvitesSeen: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
    unhide: vi.fn().mockResolvedValue(undefined),
    requestFriend: vi.fn().mockResolvedValue(undefined),
    acceptFriend: vi.fn().mockResolvedValue(undefined),
    declineFriend: vi.fn().mockResolvedValue(undefined),
    invite: vi.fn().mockResolvedValue({}),
  },
  groups: {
    create: vi.fn().mockResolvedValue({}),
    join: vi.fn().mockResolvedValue({}),
    leave: vi.fn().mockResolvedValue(undefined),
  },
  threads: {
    send: vi.fn().mockResolvedValue({}),
    markRead: vi.fn().mockResolvedValue(undefined),
    openSolo: vi.fn().mockResolvedValue({}),
  },
  plans: {
    lock: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    unlock: vi.fn().mockResolvedValue(undefined),
    markDone: vi.fn().mockResolvedValue({}),
    addJournal: vi.fn().mockResolvedValue({}),
  },
  media: {
    deletePhoto: vi.fn().mockResolvedValue(undefined),
    makeFirst: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('@/lib/api/endpoints', () => endpoints);

const { hydrateFromApi } = vi.hoisted(() => ({ hydrateFromApi: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/api/sync', () => ({ hydrateFromApi }));

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('sonner-native', () => ({ toast }));

const { uploadPhoto } = vi.hoisted(() => ({ uploadPhoto: vi.fn() }));
vi.mock('@/lib/api/media', () => ({ uploadPhoto }));

import * as actions from './actions';
import { rememberPerson, rememberPhoto, rememberPlan, rememberSomeday, resetDirectory } from '@/lib/api/directory';
import { useApp } from '@/store';

/** The bundled slug used throughout; its store id is the authored want's. */
const SLUG = 'see-an-aurora';
const SOMEDAY_UUID = 'sd-uuid-1';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function signedIn() {
  useApp.getState().loadServer({ profile: { ...useApp.getState().profile, name: 'Bea' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetDirectory();
  useApp.getState().reset();
  rememberSomeday({
    id: SOMEDAY_UUID, slug: SLUG, title: 'See an aurora',
    category: 'Nature', party: 'group', needs: [],
  });
  rememberPerson({ id: 'user-1', name: 'Mara Ilagan', handle: 'mara', gender: 'woman', city: 'Cebu City' });
});

describe('demo mode', () => {
  it('applies every change locally and calls nothing', async () => {
    // The store starts in demo; no account, no server.
    const wantId = 'w1';
    actions.keep(wantId);
    actions.pass('w2');
    actions.requestFriend('Mara Ilagan');
    await flush();

    expect(useApp.getState().keptIds).toContain(wantId);
    expect(useApp.getState().passedIds).toContain('w2');
    expect(useApp.getState().sentRequests).toContain('Mara Ilagan');
    expect(endpoints.catalog.keep).not.toHaveBeenCalled();
    expect(endpoints.catalog.pass).not.toHaveBeenCalled();
    expect(endpoints.social.requestFriend).not.toHaveBeenCalled();
  });
});

describe('keep', () => {
  it('applies at once and tells the server, resolving the slug to its id', async () => {
    signedIn();
    actions.keep(SLUG, { openTo: ['friends'], as: ['duo'] });
    // Optimistic: the store does not wait for the round trip.
    expect(useApp.getState().keptIds).toContain(SLUG);
    await flush();
    expect(endpoints.catalog.keep).toHaveBeenCalledWith(SOMEDAY_UUID, {
      open_to: ['friends'],
      party_as: ['duo'],
    });
  });

  it('falls back to the default visibility when none is given', async () => {
    signedIn();
    actions.keep(SLUG);
    await flush();
    expect(endpoints.catalog.keep).toHaveBeenCalledWith(SOMEDAY_UUID, {
      open_to: ['friends'],
      party_as: ['duo', 'group'],
    });
  });

  it('stays local when the someday has no server id, rather than calling with a bad one', async () => {
    signedIn();
    actions.keep('a-slug-the-server-never-mentioned');
    await flush();
    expect(useApp.getState().keptIds).toContain('a-slug-the-server-never-mentioned');
    expect(endpoints.catalog.keep).not.toHaveBeenCalled();
  });

  it('refetches and says so when the server refuses', async () => {
    signedIn();
    endpoints.catalog.keep.mockRejectedValueOnce(new Error('nope'));
    actions.keep(SLUG);
    await flush();
    await flush();
    // Not patched up by hand: the truth is one request away.
    expect(hydrateFromApi).toHaveBeenCalled();
    expect(toast).toHaveBeenCalled();
  });
});

describe('people', () => {
  it('resolves a name to the server id for hide and friend requests', async () => {
    signedIn();
    actions.hidePerson('Mara Ilagan');
    actions.requestFriend('Mara Ilagan');
    await flush();
    expect(endpoints.social.hide).toHaveBeenCalledWith('user-1');
    expect(endpoints.social.requestFriend).toHaveBeenCalledWith('user-1');
  });

  it('does not call the server for someone it has never heard of', async () => {
    signedIn();
    actions.requestFriend('Nobody At All');
    await flush();
    expect(useApp.getState().sentRequests).toContain('Nobody At All');
    expect(endpoints.social.requestFriend).not.toHaveBeenCalled();
  });
});

describe('plans', () => {
  it('sends the plan with people resolved to ids and the slug to a someday id', async () => {
    signedIn();
    actions.lock({
      wantId: SLUG, date: '2026-03-01', time: '09:00', people: ['Mara Ilagan'],
      split: 'kkb', confirmed: [],
    });
    await flush();
    expect(endpoints.plans.lock).toHaveBeenCalledWith(
      expect.objectContaining({ someday_id: SOMEDAY_UUID, date: '2026-03-01', people: ['user-1'] }),
    );
  });

  it('uses the plan id the directory learned, not the someday id', async () => {
    signedIn();
    rememberPlan(SLUG, 'plan-uuid-9');
    actions.markDone(SLUG);
    await flush();
    expect(endpoints.plans.markDone).toHaveBeenCalledWith('plan-uuid-9');
  });
});

describe('profile photos', () => {
  it('shows the local file at once, then swaps it for the served URL', async () => {
    signedIn();
    uploadPhoto.mockResolvedValueOnce({ id: 'photo-1', position: 0, url: 'https://store/p1.webp' });

    const pending = actions.addProfilePhoto('file:///tmp/a.jpg');
    // Visible before the upload finishes - the grid fills as the picker closes.
    expect(useApp.getState().profile.photos).toEqual(['file:///tmp/a.jpg']);

    await pending;
    expect(useApp.getState().profile.photos).toEqual(['https://store/p1.webp']);
  });

  it('removes just that photo when the upload fails, and says so', async () => {
    signedIn();
    useApp.getState().updateProfile({ photos: ['https://store/kept.webp'] });
    uploadPhoto.mockRejectedValueOnce(new Error('store refused'));

    await actions.addProfilePhoto('file:///tmp/b.jpg');

    // The existing photo survives; only the failed one disappears.
    expect(useApp.getState().profile.photos).toEqual(['https://store/kept.webp']);
    expect(toast).toHaveBeenCalled();
    // A failed upload is local; it must not refetch the whole world.
    expect(hydrateFromApi).not.toHaveBeenCalled();
  });

  it('keeps the local file in demo mode and never uploads', async () => {
    await actions.addProfilePhoto('file:///tmp/c.jpg');
    expect(useApp.getState().profile.photos).toEqual(['file:///tmp/c.jpg']);
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it('deletes by the id the directory learned, not by the URL', async () => {
    signedIn();
    rememberPhoto('https://store/p1.webp', 'photo-1');
    useApp.getState().updateProfile({ photos: ['https://store/p1.webp', 'https://store/p2.webp'] });

    actions.removeProfilePhoto('https://store/p1.webp');
    await flush();

    expect(useApp.getState().profile.photos).toEqual(['https://store/p2.webp']);
    expect(endpoints.media.deletePhoto).toHaveBeenCalledWith('photo-1');
  });

  it('promotes a photo to first locally and on the server', async () => {
    signedIn();
    rememberPhoto('https://store/p2.webp', 'photo-2');
    useApp.getState().updateProfile({ photos: ['https://store/p1.webp', 'https://store/p2.webp'] });

    actions.makePhotoFirst('https://store/p2.webp');
    await flush();

    expect(useApp.getState().profile.photos[0]).toBe('https://store/p2.webp');
    expect(endpoints.media.makeFirst).toHaveBeenCalledWith('photo-2');
  });
});

describe('messages and groups', () => {
  it('renames the attachment field the store uses to the one the wire expects', async () => {
    signedIn();
    useApp.setState({
      threads: [{ id: 'th-1', kind: 'solo', refId: 'Mara Ilagan', title: 'Mara Ilagan', messages: [], readAt: null }],
    });
    actions.sendMessage('th-1', 'this one?', { type: 'someday', refId: SOMEDAY_UUID, label: 'See an aurora' });
    await flush();
    expect(endpoints.threads.send).toHaveBeenCalledWith('th-1', {
      body: 'this one?',
      attachment: { type: 'someday', ref: SOMEDAY_UUID, label: 'See an aurora' },
    });
  });

  it('sends no attachment as null rather than undefined', async () => {
    signedIn();
    actions.sendMessage('th-1', 'hello');
    await flush();
    expect(endpoints.threads.send).toHaveBeenCalledWith('th-1', { body: 'hello', attachment: null });
  });

  it('refetches after creating a group, because the server allocates its id and token', async () => {
    signedIn();
    actions.createGroup('Sunrise Crew');
    await flush();
    expect(endpoints.groups.create).toHaveBeenCalledWith('Sunrise Crew');
    expect(hydrateFromApi).toHaveBeenCalled();
  });
});

describe('deleteAccount', () => {
  it('calls the server when signed in', async () => {
    signedIn();
    await actions.deleteAccount();
    expect(endpoints.auth.deleteMe).toHaveBeenCalled();
  });

  it('is a no-op in demo mode', async () => {
    await actions.deleteAccount();
    expect(endpoints.auth.deleteMe).not.toHaveBeenCalled();
  });
});
