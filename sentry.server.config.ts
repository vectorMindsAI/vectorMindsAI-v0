import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',

  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending error to Sentry (server):', hint.originalException)
    }
    return event
  },
  environment: process.env.NODE_ENV || 'development',
})
