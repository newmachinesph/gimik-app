import * as Sentry from '@sentry/react-native';

/**
 * Crash and error reporting.
 *
 * Off unless a DSN is configured, so a fork or a bare checkout does not quietly
 * post someone else's errors into this project.
 *
 * PII stays off. This app carries people's messages, cities and plans; the
 * useful part of a report is the stack and the route, never the payload that
 * produced it. Breadcrumbs are kept because "what were they doing" is the
 * question a stack alone cannot answer.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const monitoringEnabled = Boolean(dsn);

export function startMonitoring(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    // Dev builds report too - most of what is worth catching happens here
    // first - but they are tagged so they can be filtered out of the real ones.
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  });
}

/** Attach the signed-in account to subsequent events, by id only. */
export function identify(handle: string | null): void {
  if (!dsn) return;
  Sentry.setUser(handle ? { username: handle } : null);
}

/** Report something the app handled but should not have had to. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
