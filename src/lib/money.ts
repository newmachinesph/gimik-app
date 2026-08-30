/** Parses the plain decimal grammar accepted by the sync service and rounds
 * half-up to the database's numeric(12,2) precision. Integer cents remain exact
 * for allocation and equality checks. */
export function parseMoneyInputCents(value: string): number | null {
  const raw = value.trim();
  if (!raw || raw.length > 32 || !/^\d+(?:\.\d+)?$/.test(raw)) return null;

  const [rawWhole, fraction = ''] = raw.split('.');
  const whole = rawWhole.replace(/^0+(?=\d)/, '');
  if (whole.length > 10) return null;

  let cents = Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, '0'));
  if ((fraction[2] ?? '0') >= '5') cents += 1;
  if (cents > 999_999_999_999) return null;
  return cents;
}

export function parseMoneyInput(value: string): number | null {
  const cents = parseMoneyInputCents(value);
  return cents === null ? null : cents / 100;
}

export function formatMoneyCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Splits integer cents deterministically so the displayed shares always add
 * back to the total. Earlier participants receive at most one remainder cent. */
export function allocateMoneyEvenly(total: number, participants: string[]): Record<string, string> {
  return allocateMoneyCentsEvenly(Math.round(total * 100), participants);
}

export function allocateMoneyCentsEvenly(
  totalCents: number,
  participants: string[],
): Record<string, string> {
  if (!participants.length) return {};
  const baseCents = Math.floor(totalCents / participants.length);
  const remainder = totalCents % participants.length;
  return Object.fromEntries(participants.map((participant, index) => [
    participant,
    formatMoneyCents(baseCents + (index < remainder ? 1 : 0)),
  ]));
}
