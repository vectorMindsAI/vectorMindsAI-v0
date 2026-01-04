'use client'

import { useEffect } from 'react'

export function SentryInit() {
  useEffect(() => {
    import('../sentry.client.config')
  }, [])

  return null
}
