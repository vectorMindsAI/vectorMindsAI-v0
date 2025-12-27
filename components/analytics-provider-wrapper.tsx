"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { analytics } from '@/lib/analytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Initialize analytics on client mount
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (apiKey) {
      analytics.initialize(apiKey, { host })
    } else {
      console.warn('PostHog API key not found. Analytics will not be tracked.')
    }
  }, [])

  useEffect(() => {
    // Identify user when session changes
    if (status === 'authenticated' && session?.user) {
      analytics.identify(session.user.email || session.user.id || 'unknown', {
        email: session.user.email,
        name: session.user.name,
      })

      analytics.track('user_signed_in', {
        userId: session.user.email || session.user.id || 'unknown',
        method: 'email',
      })
    } else if (status === 'unauthenticated') {
      analytics.reset()
    }
  }, [session, status])

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User left the page - good time to flush analytics
        analytics.shutdown()
      } else {
        // User returned - reinitialize if needed
        const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
        if (apiKey) {
          analytics.initialize(apiKey, { host })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return <>{children}</>
}
