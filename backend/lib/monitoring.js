// Optional error monitoring + process-level crash guards.
//
// Sentry is wired but OFF unless you opt in: set SENTRY_DSN in the environment
// AND install the SDK (`npm i @sentry/node`). Without both it's a no-op, so
// nothing breaks in dev or if you never use Sentry.

let sentry = null;

export const initMonitoring = async () => {
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0.1 });
      sentry = Sentry;
      console.log('🛡️  Error monitoring: Sentry enabled');
    } catch {
      console.warn('⚠️  SENTRY_DSN is set but @sentry/node is not installed — run `npm i @sentry/node`.');
    }
  }

  // Never let an unhandled error silently take the process down without a trace.
  process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
    sentry?.captureException(reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    sentry?.captureException(err);
  });
};

// Report a handled error (used by the Express error handler).
export const captureError = (err) => sentry?.captureException?.(err);
