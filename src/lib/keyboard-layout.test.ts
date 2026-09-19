import { describe, expect, it } from 'vitest';

import { KEYBOARD_GAP, keyboardFooterLayout } from './keyboard-layout';

describe('keyboard footer clearance', () => {
  it('keeps a small gap instead of carrying the safe area above the keyboard', () => {
    expect(KEYBOARD_GAP).toBe(8);
    expect(keyboardFooterLayout(120, 40)).toEqual({ openedOffset: 32, inputClearance: 96 });
  });

  it('does not lift the field further on phones with taller navigation insets', () => {
    expect(keyboardFooterLayout(120, 40).inputClearance)
      .toBe(keyboardFooterLayout(96, 16).inputClearance);
  });

  it('replaces a tab dock without adding its height to input clearance', () => {
    expect(keyboardFooterLayout(96, 16, 90))
      .toEqual({ openedOffset: 98, inputClearance: 96 });
  });

  it('removes onboarding bottom padding from the measured footer', () => {
    expect(keyboardFooterLayout(180, 54))
      .toEqual({ openedOffset: 46, inputClearance: 142 });
  });

  it('stays nonnegative before the first footer measurement', () => {
    expect(keyboardFooterLayout(0, 42).inputClearance).toBe(16);
  });
});
