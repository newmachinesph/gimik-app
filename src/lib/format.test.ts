import { describe, expect, it } from 'vitest';

import { localIsoDate } from './format';

describe('localIsoDate', () => {
  it("is the device's calendar day, not UTC's", () => {
    // 05:40 local on the 20th. In any timezone east of UTC, toISOString() would
    // still say the 19th - the bug that shifted the lock strip a day early.
    expect(localIsoDate(new Date(2026, 8, 20, 5, 40))).toBe('2026-09-20');
  });

  it('pads single-digit months and days', () => {
    expect(localIsoDate(new Date(2026, 0, 3, 12))).toBe('2026-01-03');
  });
});
