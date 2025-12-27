import { useCallback } from 'react'
import { analytics, type AnalyticsEvent } from '@/lib/analytics'

/**
 * React hook for analytics tracking
 * Provides convenient methods for tracking events in components
 */
export function useAnalytics() {
  const track = useCallback(<K extends keyof AnalyticsEvent>(
    event: K,
    properties: AnalyticsEvent[K]
  ) => {
    analytics.track(event, properties)
  }, [])

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    analytics.identify(userId, traits)
  }, [])

  const reset = useCallback(() => {
    analytics.reset()
  }, [])

  const startTimer = useCallback((operationName: string) => {
    return analytics.startTimer(operationName)
  }, [])

  const pageView = useCallback((page: string, properties?: Record<string, any>) => {
    analytics.pageView(page, properties)
  }, [])

  const isFeatureEnabled = useCallback((key: string): boolean => {
    return analytics.isFeatureEnabled(key)
  }, [])

  const getFeatureFlag = useCallback((key: string): boolean | string => {
    return analytics.getFeatureFlag(key)
  }, [])

  return {
    track,
    identify,
    reset,
    startTimer,
    pageView,
    isFeatureEnabled,
    getFeatureFlag,
  }
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * import { useAnalytics } from '@/lib/hooks/useAnalytics'
 * 
 * export function MyComponent() {
 *   const { track, startTimer } = useAnalytics()
 * 
 *   const handleClick = () => {
 *     track('custom_event', {
 *       buttonName: 'submit',
 *       userId: 'user123',
 *     })
 *   }
 * 
 *   const handleSearch = async () => {
 *     const endTimer = startTimer('search_operation')
 *     await performSearch()
 *     const duration = endTimer()
 *     
 *     track('search_completed', {
 *       query: 'test',
 *       duration,
 *     })
 *   }
 * 
 *   return <button onClick={handleClick}>Track Me</button>
 * }
 * ```
 */
