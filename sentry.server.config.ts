import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,

  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    return event
  },
  environment: process.env.NODE_ENV || 'development',
})
