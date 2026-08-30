/** The three days the Lock it demonstration drops a someday onto. */
export type DemoWeekendDay = {
  key: 'fri' | 'sat' | 'sun';
  date: Date;
};

const FRIDAY = 5;
const KEYS = ['fri', 'sat', 'sun'] as const;

/**
 * The next Friday, Saturday and Sunday.
 *
 * A bucket-list item lands on a weekend, not a random Tuesday, so the
 * demonstration always shows one — and the fixed FRI/SAT/SUN labels mean the
 * three day pills never change width as the dates roll forward.
 *
 * Friday counts as today; Saturday and Sunday roll to the following week so the
 * Saturday the card lands on is always still ahead of the person watching.
 */
export function nextWeekendDays(today: Date): DemoWeekendDay[] {
  // (5 - day + 7) % 7 lands on 0 for Friday, 6 for Saturday and 5 for Sunday —
  // exactly the roll-forward the weekend framing needs.
  const untilFriday = (FRIDAY - today.getDay() + 7) % 7;

  return KEYS.map((key, index) => {
    // A fresh Date per day: the caller's own value is never advanced.
    const date = new Date(today.getTime());
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + untilFriday + index);
    return { key, date };
  });
}
