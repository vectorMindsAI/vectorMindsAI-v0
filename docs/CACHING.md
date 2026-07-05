# Caching System - Implementation Guide

## Overview

In-memory caching system to improve performance and reduce server load for BYOK model. Caches research results, planner outputs, and database queries.

## Implementation Status

### ✅ Phase 1: Infrastructure (Completed)
- Core cache system with TTL support
- Automatic cleanup of expired entries
- Statistics tracking and monitoring
- Cache management API endpoints

### ✅ Phase 2: Research Caching (Completed)
Applied caching to all research endpoints:

**Endpoints:**
- ✅ `/api/research` - Standard research (1 hour TTL)
- ✅ `/api/research/extended` - Extended research (2 hour TTL)  
- ✅ `/api/planner` - Planning agent (30 min TTL)

**Features:**
- Prevents duplicate research jobs for identical queries
- Returns cached jobId instantly (`fromCache: true`)
- Analytics tracking for cache hits
- Composite cache keys (query + criteria + model)

**Impact:**
- ⚡ Instant responses for repeated queries
- 💰 Reduces Inngest job consumption
- 🚀 Saves processing time and resources
- 😊 Better user experience (no waiting)

**Cache Keys:**
```typescript
// Research: city + criteria
research:{hash}

// Extended: city + criteria + sourceUrl  
research:extended:{hash}

// Planner: input + model
planner:{hash}
```

### ✅ Phase 3: MongoDB Query Caching (Completed)
Applied caching to frequent database queries:

**Agent Jobs:**
- ✅ `/api/agent/jobs` - List user's jobs with pagination (5 min TTL)
- ✅ `/api/agent/jobs/[jobId]` - Get specific job details (5 min TTL)
- Cache invalidation on job deletion

**Search History:**
- ✅ `/api/history` (GET) - List user's search history (10 min TTL)
- ✅ `/api/history/[id]` (GET) - Get specific history item (10 min TTL)
- Cache invalidation on create/delete

**Cache Keys:**
```typescript
// Agent jobs list
agent:jobs:{userId}:{page}:{limit}:{status}

// Single job
agent:job:{jobId}

// Search history list
history:{userId}:{page}:{limit}:{search}

// Single history item
history:item:{id}
```

**Cache Invalidation:**
- POST `/api/history` - Clears user's history cache
- DELETE `/api/history/[id]` - Clears specific item + user's list
- DELETE `/api/agent/jobs/[jobId]` - Clears job + user's job list

**Impact:**
- 🚀 Faster list views (no DB query on cache hit)
- 💾 Reduced MongoDB read operations
- 📊 Better pagination performance
- 🔄 Smart invalidation keeps data fresh

### ✅ Phase 4: Advanced Cache Invalidation (Completed)
Centralized and intelligent cache invalidation strategies:

**Centralized Module:** `lib/cache-invalidation.ts`
- `invalidateUser(userId)` - Clear all user-related caches
- `invalidateJob(jobId, userId)` - Clear job + user's job list
- `invalidateHistory(userId, historyId)` - Clear history caches
- `invalidateResearch(query, criteria)` - Clear research result caches
- `invalidateMultipleJobs(jobIds, userId)` - Batch job invalidation
- `invalidateOldEntries(maxAgeMs)` - Time-based cleanup

**Smart Invalidation Logic:**
- `onJobComplete()` - Keeps completed research cached (good for reuse!)
- `onJobFailure()` - Clears failed job results (allows retry)
- `onJobStatusChange()` - Event-driven invalidation
- Preserves valuable completed research while removing stale data

**Admin API:** `/api/cache/invalidate`
- Manual cache invalidation controls
- Actions: invalidate_user, invalidate_job, invalidate_history, invalidate_research, invalidate_old, clear_all
- GET endpoint documents all available actions with examples

**Updated Endpoints:**
- ✅ `/api/agent/jobs/[jobId]` (DELETE) - Uses `cacheInvalidation.invalidateJob()`
- ✅ `/api/history` (POST) - Uses `cacheInvalidation.invalidateHistory()`
- ✅ `/api/history/[id]` (DELETE) - Uses `cacheInvalidation.invalidateHistory()`
- ✅ `lib/store.ts` - Uses `cacheInvalidation.onJobComplete/onJobFailure()`

**Impact:**
- 🎯 Intelligent invalidation (keeps good data, clears bad)
- 🧹 Automatic cleanup on status changes
- 🔧 Manual controls for admin operations
- 📈 Better cache hit rates through smart retention

### ✅ Phase 5: Cache UI Dashboard (Completed)
Interactive dashboard for monitoring and managing cache:

**Component:** `components/cache-dashboard.tsx`
- Real-time cache statistics display
- Visual metrics with progress bars
- Hit rate monitoring with color-coded status
- Memory usage tracking
- Entry count and category breakdown

**Page:** `/cache` - Full-page cache dashboard
- **Protected route (requires admin role)**
- ⚠️ Shows system-wide cache data from ALL users
- Auto-refresh every 30 seconds
- Responsive design for mobile/desktop

**Features:**
- 📊 **Overview Cards:**
  - Hit rate with status indicators (red/yellow/green)
  - Total entries count
  - Memory usage in MB
  - Efficiency percentage with recommendations
  
- 🗂️ **Category Breakdown Tab:**
  - Visual distribution of cached items
  - Research, Jobs, History, Planner categories
  - Percentage bars for each category
  - Entry counts per category

- ⚡ **Quick Actions Tab:**
  - One-click cache clearing by category
  - Clean entries older than 1 hour
  - Pattern-based clearing (research:\*, agent:job\*, history:\*)
  - Nuclear option: Clear ALL caches

- 📋 **Cache Entries Tab:**
  - List of all active cache entries
  - Expiration countdown timers
  - Sorted by creation time (newest first)
  - Shows first 50 entries with pagination info

**Navigation:**
- "Cache Dashboard" link visible in sidebar for admin users only
- Icon: HardDrive
- Regular users: Redirected to dashboard if they try to access `/cache`
- First-time setup: Use `node scripts/make-admin.js <email>` to promote a user

**Security:**
- All cache API endpoints require `role: "admin"`
- 401 Unauthorized: Not signed in
- 403 Forbidden: Not an admin user
- See [ADMIN.md](ADMIN.md) for admin role management

**Impact:**
- 👁️ Full visibility into cache performance
- 🎮 Interactive controls for cache management
- 📈 Real-time monitoring without CLI
- 🧹 Easy cleanup and maintenance

## Configuration

### TTL Settings

```typescript
// lib/cache.ts
export const cacheTTL = {
  research: 3600,           // 1 hour
  researchExtended: 7200,   // 2 hours
  user: 900,                // 15 minutes
  agentJob: 300,            // 5 minutes
  searchHistory: 600,       // 10 minutes
  planner: 1800,            // 30 minutes
  default: 300,             // 5 minutes
}
```

### Cache Keys

```typescript
// lib/cache.ts
export const cacheKeys = {
  research: (query: string) => `research:${hash(query)}`,
  researchExtended: (query: string) => `research:extended:${hash(query)}`,
  planner: (query: string) => `planner:${hash(query)}`,
  user: (userId: string) => `user:${userId}`,
  agentJob: (jobId: string) => `agent:job:${jobId}`,
  searchHistory: (userId: string) => `history:${userId}`,
}
```

## API Usage

### Check Cache Statistics

```bash
GET /api/cache/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "statistics": {
      "totalEntries": 45,
      "totalHits": 120,
      "totalMisses": 30,
      "hitRate": "80.00%",
      "memoryUsageMB": "2.34 MB"
    },
    "performance": {
      "efficiency": "80.00",
      "recommendation": "Excellent cache performance!"
    }
  }
}
```

### Clear Cache

```bash
# Clear all
DELETE /api/cache/stats
Authorization: Bearer <token>

# Clear pattern
DELETE /api/cache/stats
Content-Type: application/json
{
  "pattern": "research:*"
}
```

### Cache Invalidation (Admin)

```bash
# Get available actions
GET /api/cache/invalidate
Authorization: Bearer <token>

# Invalidate user caches
POST /api/cache/invalidate
Authorization: Bearer <token>
Content-Type: application/json
{
  "action": "invalidate_user",
  "userId": "user123"
}

# Invalidate specific job
POST /api/cache/invalidate
Authorization: Bearer <token>
Content-Type: application/json
{
  "action": "invalidate_job",
  "jobId": "job-uuid",
  "userId": "user123"
}

# Clean old entries (older than 2 hours)
POST /api/cache/invalidate
Authorization: Bearer <token>
Content-Type: application/json
{
  "action": "invalidate_old",
  "maxAgeMs": 7200000
}

# Clear all caches (use with caution!)
POST /api/cache/invalidate
Authorization: Bearer <token>
Content-Type: application/json
{
  "action": "clear_all"
}
```

## Code Examples

### Using Cache in Endpoints

```typescript
import { cache, cacheKeys, cacheTTL } from '@/lib/cache'

// Check cache first
const cacheKey = cacheKeys.research(query);
const cached = cache.get<ResultType>(cacheKey);

if (cached) {
  return NextResponse.json({ 
    ...cached, 
    fromCache: true 
  });
}

// Perform expensive operation
const result = await performResearch(query);

// Cache the result
cache.set(cacheKey, result, cacheTTL.research);

return NextResponse.json(result);
```

### Get-or-Set Pattern

```typescript
const result = await cache.getOrSet(
  cacheKeys.research(query),
  async () => await performResearch(query),
  cacheTTL.research
);
```

### Smart Cache Invalidation

```typescript
import { cacheInvalidation } from '@/lib/cache-invalidation'

// On job completion - keeps research cached
cacheInvalidation.onJobComplete(job)

// On job failure - clears for retry
cacheInvalidation.onJobFailure(job)

// Manual invalidation
cacheInvalidation.invalidateUser(userId)
cacheInvalidation.invalidateJob(jobId, userId)
cacheInvalidation.invalidateHistory(userId)
```

## Benefits for BYOK Model

### 1. Reduced Server Load
- Fewer database queries
- Less CPU/memory usage
- Lower network bandwidth

### 2. Faster Responses
- Instant cache hits (< 1ms)
- No LLM API calls needed
- No Inngest job creation

### 3. Cost Savings
- Lower MongoDB operations
- Fewer Inngest runs
- Reduced hosting costs

### 4. Better UX
- Immediate results
- No loading spinners
- Consistent performance

## Monitoring

### Key Metrics

**Hit Rate:** Percentage of requests served from cache
- < 20%: Poor - increase TTL
- 20-40%: Moderate - review patterns
- 40-70%: Good performance
- \> 70%: Excellent efficiency

**Memory Usage:** Total cache size
- Monitor for growth
- Alert if > 100MB
- Adjust TTL if needed

**Entry Count:** Number of cached items
- Normal: 10-1000 entries
- High: > 1000 entries
- Alert if > 10,000

### Analytics Events

Phase 2 added cache hit tracking:
- `research_cache_hit`
- `extended_research_cache_hit`

Track in PostHog to measure cache effectiveness.

## Testing

### Via Web Dashboard (Recommended)
**Note:** Requires admin role. Promote a user first:
```bash
node scripts/make-admin.js your-email@example.com
```

Then:
1. Sign out and sign back in
2. Navigate to `http://localhost:3000/cache`
3. View real-time cache statistics
4. Monitor hit rate and memory usage
5. Use Quick Actions to test invalidation
6. Browse cache entries and their TTL

### Via API
```bash
# Make same research request twice
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"city":"Tokyo","apiKey":"...","tavilyKey":"..."}'

# Second request returns instantly with fromCache: true

# Check cache stats via API
curl http://localhost:3000/api/cache/stats \
  -H "Authorization: Bearer <token>"

# Clear specific cache pattern
curl -X DELETE http://localhost:3000/api/cache/stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"pattern":"research:*"}'
```

## Production Considerations

### Current Setup (In-Memory)
- ✅ Works great for single instance
- ✅ Zero external dependencies
- ✅ Fast and simple
- ⚠️ Clears on restart
- ⚠️ Not shared across instances

### Future: Redis Migration
For multi-instance deployments:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN
})

// Drop-in replacement
export const cache = {
  get: (key) => redis.get(key),
  set: (key, val, ttl) => redis.set(key, val, { ex: ttl }),
  delete: (key) => redis.del(key),
  // ...
}
```

## Troubleshooting

### Cache Not Working
1. Check imports are correct
2. Verify TTL is set
3. Review cache key generation
4. Check cache.getStats()

### Low Hit Rate
1. Increase TTL values
2. Cache more endpoints
3. Review query patterns
4. Check key consistency

### High Memory
1. Reduce TTL values
2. Implement max size
3. Clear old entries
4. Consider Redis

---

**Status:** Phase 5 Complete - Full cache dashboard with real-time monitoring
**All Phases Complete!** 🎉 Caching system is production-ready.
