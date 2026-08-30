import { useMemo } from 'react';

import { useApp, type Thread } from '@/store';

/**
 * Unread, in one place.
 *
 * Three surfaces show this count - the Invites header, the Activity row, and
 * the inbox itself - and they were each deciding for themselves what unread
 * meant. One definition, so the envelope and the list can never disagree.
 */
export function isThreadUnread(thread: Thread): boolean {
  const last = thread.messages.at(-1);
  return Boolean(last && last.from !== 'me' && (!thread.readAt || thread.readAt < last.at));
}

/** How many threads are waiting on you. */
export function useUnreadThreads(): number {
  const threads = useApp((state) => state.threads);
  return useMemo(() => threads.filter(isThreadUnread).length, [threads]);
}

/** The inbox: every thread, the one that spoke last at the top. */
export function useInboxThreads(): Thread[] {
  const threads = useApp((state) => state.threads);
  return useMemo(
    () => [...threads].sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? '')),
    [threads],
  );
}
