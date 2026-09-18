import { beforeEach, expect, it, vi } from 'vitest';
import { useApp } from '@/store';
import { rememberSomeday, resetDirectory, somedayId } from './directory';
import { hydrateFromApi } from './sync';

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  empty: vi.fn().mockResolvedValue([]),
  friends: vi.fn().mockResolvedValue({ friends: [], requests: [], sent: [] }),
}));
vi.mock('./endpoints', () => ({
  auth: { me: mocks.me }, catalog: { mine: mocks.empty },
  social: { invites: mocks.empty, friends: mocks.friends, hidden: mocks.empty },
  groups: { list: mocks.empty }, threads: { list: mocks.empty }, plans: { list: mocks.empty },
}));

beforeEach(() => {
  useApp.getState().reset();
  resetDirectory();
  mocks.me.mockResolvedValue({ id: 'me', name: 'QA', handle: 'qa', gender: null, birthday: null,
    city: 'Makati', bio: '', work: '', education: '', interests: [], languages: [], hometown: null,
    religion: null, politics: null, created_at: '2026-09-18T00:00:00Z', photos: [] });
});

it('preserves same-account journal and device preferences during refresh', async () => {
  useApp.getState().loadServer({});
  useApp.setState({
    journal: [{ id: 'entry', wantId: 'activity', body: 'Memory', at: '2026-09-18T00:00:00Z' }],
    passedIds: ['passed'], seenNewsKeys: ['seen'], rememberVisibility: true,
    defaultVisibility: { openTo: ['groups'], as: ['duo'] },
  });
  rememberSomeday({ id: 'visible-id', slug: 'visible-card', title: 'Visible', category: 'City', party: 'duo', needs: [] });
  await hydrateFromApi();
  expect(useApp.getState().journal[0].body).toBe('Memory');
  expect(useApp.getState().passedIds).toEqual(['passed']);
  expect(useApp.getState().seenNewsKeys).toEqual(['seen']);
  expect(useApp.getState().rememberVisibility).toBe(true);
  expect(useApp.getState().defaultVisibility.openTo).toEqual(['groups']);
  expect(somedayId('visible-card')).toBe('visible-id');
});

it('does not erase visible catalog identities when a refresh fails', async () => {
  rememberSomeday({ id: 'visible-id', slug: 'visible-card', title: 'Visible', category: 'City', party: 'duo', needs: [] });
  mocks.me.mockRejectedValueOnce(new Error('offline'));
  await expect(hydrateFromApi()).rejects.toThrow('offline');
  expect(somedayId('visible-card')).toBe('visible-id');
});
