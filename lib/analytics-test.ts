/**
 * Analytics Test Utility
 * Use this file to test analytics implementation
 */

import { analytics } from './analytics'

export const testAnalytics = () => {
  console.log('🧪 Testing Analytics Implementation...\n')

  // Test 1: Check if analytics is initialized
  console.log('Test 1: Initialization')
  try {
    analytics.track('research_initiated', {
      query: 'test query',
      model: 'test-model',
      criteriaCount: 3,
    })
    console.log('✅ Analytics tracking works\n')
  } catch (error) {
    console.error('❌ Analytics tracking failed:', error, '\n')
  }

  // Test 2: Test timer functionality
  console.log('Test 2: Timer')
  try {
    const endTimer = analytics.startTimer('test_operation')
    setTimeout(() => {
      const duration = endTimer()
      console.log(`✅ Timer works: ${duration}ms\n`)
    }, 100)
  } catch (error) {
    console.error('❌ Timer failed:', error, '\n')
  }

  // Test 3: Test user identification
  console.log('Test 3: User Identification')
  try {
    analytics.identify('test-user-123', {
      email: 'test@example.com',
      name: 'Test User',
    })
    console.log('✅ User identification works\n')
  } catch (error) {
    console.error('❌ User identification failed:', error, '\n')
  }

  // Test 4: Test all event types
  console.log('Test 4: Event Types')
  const events: Array<{ name: string; properties: any }> = [
    {
      name: 'research_initiated',
      properties: { query: 'Tokyo', model: 'gemini', criteriaCount: 5 },
    },
    {
      name: 'research_completed',
      properties: {
        query: 'Tokyo',
        model: 'gemini',
        duration: 2500,
        success: true,
        resultsCount: 10,
      },
    },
    {
      name: 'model_changed',
      properties: { previousModel: 'gemini', newModel: 'openai' },
    },
    {
      name: 'custom_criteria_added',
      properties: { criteriaName: 'Climate Data', criteriaType: 'weather' },
    },
  ]

  events.forEach((event) => {
    try {
      analytics.track(event.name as any, event.properties)
      console.log(`✅ Event '${event.name}' tracked successfully`)
    } catch (error) {
      console.error(`❌ Event '${event.name}' failed:`, error)
    }
  })

  console.log('\n✅ Analytics test complete!')
  console.log('Check your PostHog dashboard to see the events.')
  console.log('Dashboard: https://app.posthog.com (or your self-hosted URL)')
}

/**
 * Test analytics from browser console
 * Usage:
 * 1. Open browser dev tools
 * 2. Import and run:
 *    import { testAnalytics } from '@/lib/analytics-test'
 *    testAnalytics()
 */
export const browserTest = () => {
  if (typeof window === 'undefined') {
    console.error('❌ This test must be run in the browser!')
    return
  }

  console.log('🌐 Running browser analytics test...\n')

  // Check if PostHog is loaded
  if (!(window as any).posthog) {
    console.error('❌ PostHog not loaded! Check your configuration.')
    return
  }

  console.log('✅ PostHog is loaded')

  // Check if initialized
  const posthog = (window as any).posthog
  if (!posthog.__loaded) {
    console.error('❌ PostHog not initialized! Check your API key.')
    return
  }

  console.log('✅ PostHog is initialized')
  console.log('✅ All browser tests passed!\n')

  // Run additional tests
  testAnalytics()
}

/**
 * Quick verification script
 * Add to your page temporarily to verify setup
 */
export const quickVerify = () => {
  const results = {
    posthogLoaded: false,
    posthogInitialized: false,
    apiKeyPresent: false,
    trackingWorks: false,
  }

  // Check PostHog loaded
  results.posthogLoaded = typeof window !== 'undefined' && !!(window as any).posthog

  // Check PostHog initialized
  if (results.posthogLoaded) {
    results.posthogInitialized = !!(window as any).posthog.__loaded
  }

  // Check API key
  results.apiKeyPresent = !!process.env.NEXT_PUBLIC_POSTHOG_KEY

  // Test tracking
  try {
    analytics.track('test_event', { test: true } as any)
    results.trackingWorks = true
  } catch {
    results.trackingWorks = false
  }

  // Print results
  console.log('📊 Analytics Verification Results:')
  console.log('─'.repeat(50))
  Object.entries(results).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌'
    console.log(`${icon} ${key}: ${value}`)
  })
  console.log('─'.repeat(50))

  const allPassed = Object.values(results).every((v) => v)
  if (allPassed) {
    console.log('🎉 All checks passed! Analytics is working correctly.')
  } else {
    console.log('⚠️ Some checks failed. Review the configuration.')
    if (!results.apiKeyPresent) {
      console.log(
        '\n💡 Tip: Add NEXT_PUBLIC_POSTHOG_KEY to your .env.local file'
      )
    }
  }

  return results
}

// Export for use in components
export default {
  testAnalytics,
  browserTest,
  quickVerify,
}
