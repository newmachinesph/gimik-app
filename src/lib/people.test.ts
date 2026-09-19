import { afterEach, describe, expect, it } from 'vitest';

import { PERSON_BY_NAME } from './people';
import { registerPerson, resetRegistry } from './registry';
import type { Person } from './people';

const serverJon = (handle: string): Person => ({
  id: 'server-uuid',
  name: 'Jon Reyes',
  handle,
  gender: 'man',
  age: 0,
  city: 'Makati',
  bio: '',
  work: '',
  education: '',
  hometown: '',
  languages: [],
  photoCount: 0,
  leans: [],
});

afterEach(() => resetRegistry());

describe('PERSON_BY_NAME', () => {
  it('keeps a seeded person handle-less when the server has not mentioned them', () => {
    expect(PERSON_BY_NAME.get('Jon Reyes')?.handle).toBeUndefined();
  });

  it("takes the server's handle for a seeded person, so their live profile can load", () => {
    registerPerson(serverJon('jon-reyes'));
    const jon = PERSON_BY_NAME.get('Jon Reyes');
    expect(jon?.handle).toBe('jon-reyes');
    expect(jon?.work).toBe('Sous chef, Toyo Eatery');
  });

  it('returns a server-only person as the server described them', () => {
    registerPerson({ ...serverJon('riley'), name: 'Riley Santos' });
    expect(PERSON_BY_NAME.get('Riley Santos')?.handle).toBe('riley');
  });
});
