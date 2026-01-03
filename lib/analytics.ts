import posthog from 'posthog-js'

export type AnalyticsEvent = {
  // Research Events
  'research_initiated': {
    query: string
    model: string
    criteriaCount: number
    userId?: string
  }
  'research_completed': {
    query: string
    model: string
    duration: number
    success: boolean
    resultsCount: number
    outputLength?: number
    outputCharacters?: number
    userId?: string
  }
  'research_failed': {
    query: string
    model: string
    error: string
    userId?: string
  }
  'model_usage_tracked': {
    model: string
    operation: string
    outputLength: number
    duration: number
    tokensEstimate?: number
    userId?: string
  }
  'extended_research_started': {
    query: string
    selectedIds: number
    userId?: string
  }
  'extended_research_completed': {
    query: string
    duration: number
    enrichedCount: number
    userId?: string
  }
  'research_cache_hit': {
    query: string
    cachedJobId: string
    userId?: string
  }
  'extended_research_cache_hit': {
    query: string
    cachedJobId: string
    userId?: string
  }
  
  // Model Usage Events
  'model_changed': {
    previousModel: string
    newModel: string
    userId?: string
  }
  'model_settings_updated': {
    model: string
    settings: Record<string, any>
    userId?: string
  }
  
  // Criteria Events
  'custom_criteria_added': {
    criteriaName: string
    criteriaType: string
    userId?: string
  }
  'custom_criteria_removed': {
    criteriaName: string
    userId?: string
  }
  
  // Vector Store Events
  'vector_store_search': {
    query: string
    resultsCount: number
    userId?: string
  }
  'vector_store_document_added': {
    documentType: string
    userId?: string
  }
  
  // Search History Events
  'search_history_viewed': {
    userId?: string
  }
  'search_history_item_deleted': {
    searchId: string
    userId?: string
  }
  'search_history_item_viewed': {
    searchId: string
    userId?: string
  }
  
  // Authentication Events
  'user_signed_in': {
    userId: string
    method: string
  }
  'user_signed_up': {
    userId: string
    method: string
  }
  'user_signed_out': {
    userId: string
  }
  
  // Error Events
  'api_error': {
    endpoint: string
    errorMessage: string
    statusCode?: number
    userId?: string
  }
  'client_error': {
    component: string
    errorMessage: string
    userId?: string
  }
  
  // Performance Events
  'page_load': {
    page: string
    loadTime: number
    userId?: string
  }
  'api_response_time': {
    endpoint: string
    duration: number
    success: boolean
    userId?: string
  }
}

class Analytics {
  private initialized = false
  private userId: string | null = null

  initialize(apiKey: string, options?: {
    host?: string
    capturePageview?: boolean
    capturePageleave?: boolean
  }) {
    if (this.initialized) return

    // Only initialize on client side
    if (typeof window === 'undefined') return

    try {
      posthog.init(apiKey, {
        api_host: options?.host || 'https://app.posthog.com',
        capture_pageview: options?.capturePageview ?? true,
        capture_pageleave: options?.capturePageleave ?? true,
        persistence: 'localStorage',
        autocapture: true,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '*',
        },
      })
      this.initialized = true
      console.log('✅ Analytics initialized')
    } catch (error) {
      console.error('Failed to initialize analytics:', error)
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (!this.initialized) return
    this.userId = userId
    posthog.identify(userId, traits)
  }

  reset() {
    if (!this.initialized) return
    this.userId = null
    posthog.reset()
  }

  track<K extends keyof AnalyticsEvent>(
    event: K,
    properties: AnalyticsEvent[K]
  ) {
    if (!this.initialized) {
      console.warn('Analytics not initialized, skipping event:', event)
      return
    }

    try {
      // Add common properties
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        userId: this.userId || properties.userId || 'anonymous',
      }

      posthog.capture(event, enrichedProperties)
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Event:', event, enrichedProperties)
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  // Convenience method for timing operations
  startTimer(operationName: string): () => number {
    const startTime = performance.now()
    return () => {
      const duration = Math.round(performance.now() - startTime)
      return duration
    }
  }

  // Page view tracking
  pageView(page: string, properties?: Record<string, any>) {
    if (!this.initialized) return
    
    posthog.capture('$pageview', {
      page,
      ...properties,
      userId: this.userId,
    })
  }

  // Feature flag methods (for A/B testing)
  getFeatureFlag(key: string): boolean | string {
    if (!this.initialized) return false
    return posthog.getFeatureFlag(key) || false
  }

  isFeatureEnabled(key: string): boolean {
    if (!this.initialized) return false
    return posthog.isFeatureEnabled(key) ?? false
  }

  // Get session replay URL (useful for debugging)
  getSessionReplayUrl(): string | null {
    if (!this.initialized) return null
    return posthog.get_session_replay_url() || null
  }

  // Shutdown method
  shutdown() {
    if (!this.initialized) return
    // PostHog doesn't have shutdown in browser, just reset
    posthog.reset()
    this.initialized = false
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Export convenience function for server-side tracking
export async function trackServerEvent<K extends keyof AnalyticsEvent>(
  event: K,
  properties: AnalyticsEvent[K],
  apiKey?: string
) {
  // For server-side tracking, we'll use fetch to send events directly to PostHog
  if (!apiKey) {
    console.warn('Server-side analytics not configured, skipping event:', event)
    return
  }

  try {
    const response = await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      console.error('Failed to track server event:', await response.text())
    }
  } catch (error) {
    console.error('Failed to track server event:', error)
  }
}
