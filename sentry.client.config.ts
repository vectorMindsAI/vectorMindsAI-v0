import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event, hint) {
    const error = hint.originalException

    if (process.env.NODE_ENV === 'development') {
      return null
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message)
      if (message.includes('chrome-extension://')) {
        return null
      }
      
      if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
        return null
      }
    }
    return event
  },
  environment: process.env.NODE_ENV || 'development',
})
