/** Clearance in layout points, not physical screenshot pixels. */
export const KEYBOARD_GAP = 8;

/** The keyboard replaces the bottom safe area and any tab dock. Count only
 * the part of a sticky footer that remains visible above the keyboard. */
export function keyboardFooterLayout(height: number, paddingBottom: number, dockFloor = 0) {
  return {
    openedOffset: dockFloor + paddingBottom - KEYBOARD_GAP,
    inputClearance: Math.max(0, height - paddingBottom) + KEYBOARD_GAP * 2,
  };
}
