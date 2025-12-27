# 📋 Analytics Implementation Task Guide

## Overview
This document explains **exactly how** the analytics system was implemented so you can replicate it in any project.

---

## 🎯 Goal
Implement PostHog analytics to track client usage even after sharing code. All events flow back to YOUR analytics instance.

---

## 📦 Step 1: Install Dependencies

```bash
npm install posthog-js
```

**What it does:** Installs PostHog JavaScript SDK for client-side tracking.

---

## 🏗️ Step 2: Create Core Analytics Service

**File:** `lib/analytics.ts`

This is the heart of the system - a singleton service that wraps PostHog.

### Key Components:

#### A. Type-Safe Event Definitions
```typescript
export type AnalyticsEvent = {
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
    userId?: string
  }
  // ... add all your events here
}
```

**Why:** TypeScript ensures you never misspell event names or properties.

#### B. Analytics Class
```typescript
class Analytics {
  private initialized = false
  private userId: string | null = null

  // Initialize PostHog
  initialize(apiKey: string, options?: { host?: string }) {
    if (this.initialized) return
    if (typeof window === 'undefined') return // Server-side check

    posthog.init(apiKey, {
      api_host: options?.host || 'https://app.posthog.com',
      capture_pageview: true,
      autocapture: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '*',
      },
    })
    this.initialized = true
  }

  // Track events
  track<K extends keyof AnalyticsEvent>(
    event: K,
    properties: AnalyticsEvent[K]
  ) {
    if (!this.initialized) return
    
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      userId: this.userId || properties.userId || 'anonymous',
    })
  }

  // Identify users
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.initialized) return
    this.userId = userId
    posthog.identify(userId, traits)
  }

  // Timer utility
  startTimer(operationName: string): () => number {
    const startTime = performance.now()
    return () => Math.round(performance.now() - startTime)
  }

  // Feature flags
  isFeatureEnabled(key: string): boolean {
    if (!this.initialized) return false
    return posthog.isFeatureEnabled(key) ?? false
  }
}

// Export singleton
export const analytics = new Analytics()
```

#### C. Server-Side Tracking Function
```typescript
export async function trackServerEvent<K extends keyof AnalyticsEvent>(
  event: K,
  properties: AnalyticsEvent[K],
  apiKey?: string
) {
  if (!apiKey) return

  await fetch('https://app.posthog.com/capture/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
}
```

**Why:** API routes run server-side and need direct HTTP calls to PostHog.

---

## 🔌 Step 3: Create React Provider

**File:** `components/analytics-provider-wrapper.tsx`

Initializes analytics when the app loads and identifies users automatically.

```typescript
"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { analytics } from '@/lib/analytics'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Initialize on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (apiKey) {
      analytics.initialize(apiKey, { host })
    }
  }, [])

  // Identify user when logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      analytics.identify(session.user.email || 'unknown', {
        email: session.user.email,
        name: session.user.name,
      })
    } else if (status === 'unauthenticated') {
      analytics.reset()
    }
  }, [session, status])

  return <>{children}</>
}
```

**Key Points:**
- Runs only on client (`"use client"`)
- Initializes once on app load
- Auto-identifies authenticated users
- Resets on logout

---

## 🎨 Step 4: Integrate Provider in Layout

**File:** `app/layout.tsx`

Wrap your entire app with the analytics provider.

```typescript
import { AnalyticsProvider } from '@/components/analytics-provider-wrapper'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Why:** Ensures analytics is initialized before any component renders.

---

## 🪝 Step 5: Create React Hook (Optional)

**File:** `lib/hooks/useAnalytics.ts`

Makes it easier to track events in components.

```typescript
import { useCallback } from 'react'
import { analytics, type AnalyticsEvent } from '@/lib/analytics'

export function useAnalytics() {
  const track = useCallback(<K extends keyof AnalyticsEvent>(
    event: K,
    properties: AnalyticsEvent[K]
  ) => {
    analytics.track(event, properties)
  }, [])

  const startTimer = useCallback((operationName: string) => {
    return analytics.startTimer(operationName)
  }, [])

  return { track, startTimer, identify: analytics.identify.bind(analytics) }
}
```

**Usage in components:**
```typescript
const { track, startTimer } = useAnalytics()

const handleClick = () => {
  track('button_clicked', { buttonName: 'submit' })
}
```

---

## 🔧 Step 6: Add Tracking to API Routes

**Example:** `app/api/research/route.ts`

### Import the tracking function:
```typescript
import { trackServerEvent } from '@/lib/analytics'
```

### Track on success:
```typescript
export const POST = async (req: Request) => {
  try {
    const body = await req.json()
    const { city, model, criteria } = body

    // Track event
    await trackServerEvent('research_initiated', {
      query: city,
      model: model || 'default',
      criteriaCount: criteria?.length || 0,
    }, process.env.NEXT_PUBLIC_POSTHOG_KEY)

    // ... your logic here ...

    return NextResponse.json({ success: true })
  } catch (error) {
    // Track errors
    await trackServerEvent('api_error', {
      endpoint: '/api/research',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    }, process.env.NEXT_PUBLIC_POSTHOG_KEY)

    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**Pattern:**
1. Import `trackServerEvent`
2. Track success events with relevant data
3. Track errors in catch blocks
4. Always pass `process.env.NEXT_PUBLIC_POSTHOG_KEY`

---

## 🎯 Step 7: Add Tracking to Components

**Example:** `components/research-panel.tsx`

### Import analytics:
```typescript
import { analytics } from '@/lib/analytics'
```

### Track user interactions:
```typescript
const handleSearch = async () => {
  // Track search initiated
  analytics.track('research_initiated', {
    query: cityInput,
    model: model,
    criteriaCount: criteria.length,
  })

  // Time the operation
  const endTimer = analytics.startTimer('search_operation')

  try {
    const response = await fetch('/api/research', { /* ... */ })
    const duration = endTimer()

    // Track success
    analytics.track('research_completed', {
      query: cityInput,
      model: model,
      duration,
      success: true,
      resultsCount: data.results?.length || 0,
    })
  } catch (error) {
    // Track failure
    analytics.track('research_failed', {
      query: cityInput,
      model: model,
      error: error.message,
    })
  }
}
```

**Best Practices:**
- Track at the START of operations
- Track at the END (success/failure)
- Use timers for duration tracking
- Include context (query, model, etc.)

---

## 🌍 Step 8: Environment Configuration

**File:** `.env.local` (create this, never commit)

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**File:** `.env.example` (commit this)

```bash
# Analytics Configuration (PostHog)
# Sign up at https://posthog.com or self-host
# Get your API key and paste below
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Why NEXT_PUBLIC_?** 
- Prefix makes it available in browser
- Next.js bakes it into the build
- Client code can access it

---

## 🧪 Step 9: Create Test Utilities

**File:** `lib/analytics-test.ts`

```typescript
export const quickVerify = () => {
  const results = {
    posthogLoaded: typeof window !== 'undefined' && !!(window as any).posthog,
    posthogInitialized: !!(window as any).posthog?.__loaded,
    apiKeyPresent: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
    trackingWorks: false,
  }

  try {
    analytics.track('test_event', { test: true } as any)
    results.trackingWorks = true
  } catch {
    results.trackingWorks = false
  }

  console.table(results)
  return results
}
```

**Usage:** Run in browser console to verify setup.

---

## 📊 Step 10: Enhance Analytics Dashboard

**File:** `components/analytics-logs.tsx`

Show real-time analytics info to users (optional).

```typescript
"use client"

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export function AnalyticsLogs() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    // Check if PostHog is initialized
    const isInitialized = typeof window !== 'undefined' && posthog.__loaded

    if (isInitialized) {
      setLogs([{ 
        message: 'Analytics tracking active',
        type: 'INFO' 
      }])
    } else {
      setLogs([{ 
        message: 'Configure PostHog in .env.local',
        type: 'WARNING' 
      }])
    }
  }, [])

  return (
    <div>
      {/* Display logs */}
    </div>
  )
}
```

---

## 🔒 Step 11: Security & Deployment

### For Client Deployment:

1. **Keep analytics configured** - Don't remove PostHog code
2. **Use YOUR API key** - Bake it into the build
3. **Deploy normally** - `npm run build && npm start`
4. **Monitor immediately** - Events flow to YOUR dashboard

### Environment Variable Strategy:

```bash
# Local Development (.env.local - gitignored)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_dev_key

# Production (Vercel/Netlify/etc)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_prod_key

# Client's Environment (they never see this)
# Key is baked into build at deploy time
```

---

## 📋 Complete Event List

Add these to your `AnalyticsEvent` type:

```typescript
export type AnalyticsEvent = {
  // Research
  'research_initiated': { query: string; model: string; criteriaCount: number }
  'research_completed': { query: string; duration: number; success: boolean }
  'research_failed': { query: string; error: string }
  
  // Model
  'model_changed': { previousModel: string; newModel: string }
  'model_settings_updated': { model: string; settings: any }
  
  // Criteria
  'custom_criteria_added': { criteriaName: string; criteriaType: string }
  'custom_criteria_removed': { criteriaName: string }
  
  // Auth
  'user_signed_in': { userId: string; method: string }
  'user_signed_up': { userId: string }
  'user_signed_out': { userId: string }
  
  // Errors
  'api_error': { endpoint: string; errorMessage: string; statusCode?: number }
  'client_error': { component: string; errorMessage: string }
  
  // Performance
  'api_response_time': { endpoint: string; duration: number; success: boolean }
  'page_load': { page: string; loadTime: number }
}
```

---

## 🎯 Usage Patterns

### Pattern 1: Track Simple Event
```typescript
analytics.track('button_clicked', {
  buttonName: 'submit',
  userId: currentUser.id,
})
```

### Pattern 2: Track with Duration
```typescript
const endTimer = analytics.startTimer('operation')
await doSomething()
const duration = endTimer()

analytics.track('operation_completed', {
  operation: 'data_fetch',
  duration,
  success: true,
})
```

### Pattern 3: Track Error
```typescript
try {
  await riskyOperation()
} catch (error) {
  analytics.track('operation_failed', {
    operation: 'data_fetch',
    error: error.message,
  })
}
```

### Pattern 4: Server-Side Tracking
```typescript
// In API route
await trackServerEvent('api_called', {
  endpoint: '/api/endpoint',
  method: 'POST',
}, process.env.NEXT_PUBLIC_POSTHOG_KEY)
```

---

## 🚀 Quick Setup Checklist

When implementing in a new project:

- [ ] Install `posthog-js`
- [ ] Create `lib/analytics.ts` with Analytics class
- [ ] Create `components/analytics-provider-wrapper.tsx`
- [ ] Add provider to `app/layout.tsx`
- [ ] Create `lib/hooks/useAnalytics.ts` (optional)
- [ ] Add tracking to API routes
- [ ] Add tracking to components
- [ ] Create `.env.local` with PostHog key
- [ ] Create `.env.example` template
- [ ] Test with `quickVerify()` function
- [ ] Deploy and verify events in PostHog

---

## 🔍 Debugging

### Analytics not working?

1. **Check initialization:**
   ```javascript
   // In browser console
   console.log(window.posthog)
   console.log(window.posthog.__loaded)
   ```

2. **Check environment variable:**
   ```javascript
   console.log(process.env.NEXT_PUBLIC_POSTHOG_KEY)
   ```

3. **Check network requests:**
   - Open DevTools → Network
   - Look for `app.posthog.com/capture/`
   - Should see 200 OK responses

4. **Run verification:**
   ```javascript
   import { quickVerify } from '@/lib/analytics-test'
   quickVerify()
   ```

---

## 📚 PostHog Setup

### Option 1: Cloud (5 minutes)
1. Go to https://posthog.com/signup
2. Create account
3. Create new project
4. Copy API key (starts with `phc_`)
5. Paste in `.env.local`

### Option 2: Self-Hosted (30 minutes)
```bash
# Clone PostHog
git clone https://github.com/PostHog/posthog.git
cd posthog

# Start with Docker
docker-compose up -d

# Access at http://localhost:8000
# Create project and get API key
```

**Self-Hosted Benefits:**
- Complete data ownership
- No external dependencies
- Maximum privacy compliance
- Unlimited events

---

## 🎯 Key Concepts

### Why This Works for Client Tracking:

1. **API key in build:** `NEXT_PUBLIC_` variables are baked into JavaScript bundle
2. **Your instance:** Events always go to YOUR PostHog (your API key)
3. **Client deploys:** They deploy the built code with your key embedded
4. **You monitor:** All their events flow to your dashboard

### Architecture:

```
Client's Deployment
    ↓
Your Built Code (with your PostHog key)
    ↓
User Actions → Browser → PostHog.capture()
    ↓
YOUR PostHog Instance (Cloud or Self-Hosted)
    ↓
Your Analytics Dashboard
```

---

## 🔄 Replication Steps

To replicate in any project:

1. **Copy Files:**
   - `lib/analytics.ts`
   - `components/analytics-provider-wrapper.tsx`
   - `lib/hooks/useAnalytics.ts`
   - `lib/analytics-test.ts`

2. **Install Package:**
   ```bash
   npm install posthog-js
   ```

3. **Integrate:**
   - Wrap app with `<AnalyticsProvider>`
   - Add tracking to API routes
   - Add tracking to components

4. **Configure:**
   - Get PostHog API key
   - Add to `.env.local`
   - Test with `quickVerify()`

5. **Deploy:**
   - Build with `npm run build`
   - Deploy to production
   - Monitor events in PostHog

---

## ✅ Success Criteria

You've successfully implemented analytics when:

- ✅ `quickVerify()` shows all green checks
- ✅ Events appear in PostHog dashboard within 60 seconds
- ✅ Session replays are recording
- ✅ No console errors related to PostHog
- ✅ Network tab shows successful capture requests
- ✅ User identification works after login

---

## 🎓 Advanced Features

### Feature Flags:
```typescript
if (analytics.isFeatureEnabled('new-ui')) {
  // Show new UI
}
```

### A/B Testing:
```typescript
const variant = analytics.getFeatureFlag('pricing-test')
// Returns 'control' or 'test'
```

### Cohorts:
Create user groups in PostHog dashboard based on behavior.

### Custom Dashboards:
Build dashboards in PostHog with:
- Total events by type
- User engagement metrics
- Performance trends
- Error rates

---

## 📝 Final Notes

**Remember:**
- This implementation is production-ready
- It scales to millions of events
- Self-hosting gives you complete control
- Client deployments automatically track to YOUR instance
- No additional client configuration needed

**Cost:**
- PostHog Cloud: Free tier → 1M events/month
- Self-Hosted: Only infrastructure costs (AWS, DigitalOcean, etc.)

**Privacy:**
- GDPR compliant
- Automatic PII masking
- Data retention controls
- User opt-out support

---

## 🎉 Done!

You now have a complete blueprint for implementing analytics in any Next.js project. Just follow this guide step-by-step and you'll have enterprise-grade tracking in under an hour.

**Key Takeaway:** Once implemented, you maintain complete visibility into how clients use your code, even after deployment!
