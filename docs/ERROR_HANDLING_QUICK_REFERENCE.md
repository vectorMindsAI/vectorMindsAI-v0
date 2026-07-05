# Error Handling Quick Reference

## 🚀 Quick Start

### Wrap Component with Error Boundary
```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary level="section">
  <YourComponent />
</ErrorBoundary>
```

### Add Logging to Component
```tsx
import { logger } from '@/lib/logger'

// Log info
logger.info('Action performed', { action: 'click' })

// Log error
try {
  riskyOperation()
} catch (error) {
  logger.error('Operation failed', error, { component: 'MyComponent' })
}
```

### Add Logging to API Route
```tsx
import { logServerError, logServerInfo } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    logServerInfo('Request received', { endpoint: '/api/data' })
    // ... handle request
    return NextResponse.json({ success: true })
  } catch (error) {
    logServerError('Request failed', error, { endpoint: '/api/data' })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## 📋 Error Boundary Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `app` | Root layout only | Entire application |
| `page` | Whole page | Auth pages, detail pages |
| `section` | Tab content, panels | Dashboard tabs |
| `component` | Small widgets | Individual form fields |

## 🔧 Logger Methods

### Client-Side
```tsx
import { logger } from '@/lib/logger'

logger.debug('Debug message', { data })      // Dev only
logger.info('Info message', { data })        // Always
logger.warn('Warning message', { data })     // Always
logger.error('Error message', error, { data }) // Always + Analytics
```

### Server-Side
```tsx
import { logServerInfo, logServerWarn, logServerError } from '@/lib/logger'

logServerInfo('Info message', { data })
logServerWarn('Warning message', { data })
logServerError('Error message', error, { data })
```

### Advanced
```tsx
// Track API call duration automatically
const data = await logger.trackApiCall(
  '/api/endpoint',
  async () => fetch('/api/endpoint').then(r => r.json()),
  { extraContext: 'value' }
)

// Track user action
logger.trackAction('button_clicked', {
  buttonName: 'submit',
  page: 'dashboard'
})
```

## 🎯 Common Patterns

### Pattern 1: Wrap Feature Section
```tsx
<ErrorBoundary level="section">
  <FeaturePanel />
</ErrorBoundary>
```

### Pattern 2: Custom Fallback
```tsx
<ErrorBoundary 
  level="component"
  fallback={<div>Loading failed. <button>Retry</button></div>}
>
  <DataTable />
</ErrorBoundary>
```

### Pattern 3: Custom Error Handler
```tsx
<ErrorBoundary 
  level="section"
  onError={(error, errorInfo) => {
    console.log('Custom handling:', error)
    // Send to custom service
  }}
>
  <CriticalComponent />
</ErrorBoundary>
```

### Pattern 4: Async Error Handling
```tsx
import { useErrorHandler } from '@/components/error-boundary'

function MyComponent() {
  const handleError = useErrorHandler()
  
  const loadData = async () => {
    try {
      await fetchData()
    } catch (error) {
      handleError(error as Error) // Throws to nearest boundary
    }
  }
}
```

### Pattern 5: API Route with Logging
```tsx
export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    logServerInfo('API called', { endpoint: '/api/data' })
    
    const result = await processRequest(req)
    
    logServerInfo('API success', { 
      endpoint: '/api/data',
      duration: Date.now() - startTime 
    })
    
    return NextResponse.json(result)
  } catch (error) {
    logServerError('API failed', error, {
      endpoint: '/api/data',
      duration: Date.now() - startTime
    })
    
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## ⚡ Best Practices

### ✅ DO
- Wrap sections that can fail independently
- Include context in logs
- Use appropriate log levels
- Catch and log async errors
- Provide user-friendly error messages

### ❌ DON'T
- Wrap every tiny component
- Log without context
- Use console.log in production
- Ignore errors silently
- Show technical errors to users

## 🧪 Testing

### Test URL
```
http://localhost:3000/test-error-handling
```

### Manual Test
```tsx
// Create test component
function ErrorTest() {
  const [error, setError] = useState(false)
  if (error) throw new Error('Test error!')
  return <button onClick={() => setError(true)}>Trigger Error</button>
}

// Wrap with boundary
<ErrorBoundary level="section">
  <ErrorTest />
</ErrorBoundary>
```

### Verify Logging
```tsx
// Open browser console
// Click buttons on /test-error-handling
// Check console output
// Check PostHog analytics
```

## 📊 What Gets Tracked

### Automatically Tracked Events
- `client_error` - Component errors
- `api_error` - API failures
- `api_response_time` - API performance

### Event Properties
```javascript
{
  component: 'ComponentName',
  errorMessage: 'Error description',
  errorStack: 'Full stack trace',
  timestamp: '2026-01-03T...',
  userAgent: 'Mozilla...',
  url: 'https://...'
}
```

## 🔍 Debugging

### View Logs
1. **Browser Console** - F12 → Console tab
2. **Analytics** - PostHog dashboard → Events
3. **API Logs** - GET `/api/errors/log`

### Common Issues

**Error boundary not catching:**
- Make sure error occurs during render
- Check boundary is parent of failing component
- Use `useErrorHandler` for async errors

**Logs not appearing:**
- Check browser console is open
- Verify logger is imported
- Check PostHog configuration

**Analytics not tracking:**
- Verify PostHog is initialized
- Check `NEXT_PUBLIC_POSTHOG_KEY` env var
- Open PostHog debugger

## 🎨 Fallback UI Examples

### Minimal (Component Level)
```tsx
<div className="p-2 text-sm text-destructive">
  Failed to load. <button>Retry</button>
</div>
```

### Standard (Section Level)
```tsx
<Card className="border-destructive">
  <CardHeader>
    <CardTitle>Section Error</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={handleRetry}>Reload Section</Button>
  </CardContent>
</Card>
```

### Full (Page Level)
```tsx
<div className="min-h-screen flex items-center justify-center">
  <Card>
    <CardHeader>
      <CardTitle>Page Error</CardTitle>
      <CardDescription>Something went wrong</CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={handleRetry}>Try Again</Button>
      <Button onClick={goHome}>Go Home</Button>
    </CardContent>
  </Card>
</div>
```

## 📚 Documentation Files

- `ERROR_HANDLING_GUIDE.md` - Complete usage guide
- `ERROR_HANDLING_SUMMARY.md` - Implementation summary
- `ERROR_HANDLING_CHECKLIST.md` - Implementation checklist
- `ERROR_HANDLING_ARCHITECTURE.md` - Architecture diagrams
- `ERROR_HANDLING_QUICK_REFERENCE.md` - This file

## 🆘 Need Help?

1. Check documentation files above
2. Visit `/test-error-handling` to test
3. Review browser console for errors
4. Check PostHog for tracked events
5. Inspect component stack traces

## 💡 Tips

- Start with section-level boundaries
- Add logging before implementing features
- Test error scenarios during development
- Monitor errors in production analytics
- Keep error messages user-friendly
- Include context in all logs

---

**Remember:** Good error handling improves user experience and makes debugging easier!
