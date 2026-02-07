import { cache, cacheKeys } from './cache'

const sanitizeForLog = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[\r\n]/g, '')
}

export const cacheInvalidation = {
  invalidateUser: (userId: string) => {
    cache.deleteByPrefix(`user:${userId}`)
    cache.deleteByPrefix(`agent:jobs:${userId}:`)
    cache.deleteByPrefix(`history:${userId}:`)
    console.log(`[Cache] Invalidated all caches for user: ${sanitizeForLog(userId)}`)
  },

  invalidateJob: (jobId: string, userId?: string) => {
    cache.delete(cacheKeys.agentJob(jobId))
    
    if (userId) {
      cache.deleteByPrefix(`agent:jobs:${userId}:`)
    }
    
    console.log(`[Cache] Invalidated job: ${sanitizeForLog(jobId)}`)
  },

  invalidateHistory: (userId: string, historyId?: string) => {
    cache.deleteByPrefix(`history:${userId}:`)
    
    if (historyId) {
      cache.delete(cacheKeys.searchHistoryItem(historyId))
    }
    
    console.log(`[Cache] Invalidated history for user: ${sanitizeForLog(userId)}`)
  },

  invalidateResearch: (query: string, criteria?: any) => {
    const cacheKey = cacheKeys.research(query + JSON.stringify(criteria || ""))
    cache.delete(cacheKey)
    console.log(`[Cache] Invalidated research: ${sanitizeForLog(query)}`)
  },

  invalidateExtendedResearch: (query: string, criteria?: any, sourceUrl?: string) => {
    const cacheKey = cacheKeys.researchExtended(
      query + JSON.stringify(criteria) + (sourceUrl || "")
    )
    cache.delete(cacheKey)
    console.log(`[Cache] Invalidated extended research: ${sanitizeForLog(query)}`)
  },

  invalidatePlanner: (input: string, model?: string) => {
    const cacheKey = cacheKeys.planner(input + (model || ""))
    cache.delete(cacheKey)
    console.log(`[Cache] Invalidated planner: ${sanitizeForLog(input)}`)
  },

  onJobComplete: (jobId: string, userId?: string, jobType?: string, query?: string) => {
    cacheInvalidation.invalidateJob(jobId, userId)
    if (jobType === 'research' || jobType === 'extended_research') {
      console.log(`[Cache] Research job completed - keeping research cache for reuse`)
    }
  },

  onJobFailure: (jobId: string, userId?: string, jobType?: string, query?: string) => {
    cacheInvalidation.invalidateJob(jobId, userId)
    
    if (jobType === 'research' && query) {
      cacheInvalidation.invalidateResearch(query)
    } else if (jobType === 'extended_research' && query) {
      cacheInvalidation.invalidateExtendedResearch(query)
    }
    
    console.log(`[Cache] Invalidated failed job: ${sanitizeForLog(jobId)}`)
  },
  invalidateMultipleJobs: (jobIds: string[], userId?: string) => {
    jobIds.forEach(jobId => cache.delete(cacheKeys.agentJob(jobId)))
    
    if (userId) {
      cache.deletePattern(`agent:jobs:${userId}:.*`)
    }
    
    console.log(`[Cache] Invalidated ${jobIds.length} jobs`)
  },

  invalidateOldEntries: (maxAgeMs: number = 60 * 60 * 1000) => {
    const keys = cache.keys()
    let cleaned = 0
    
    keys.forEach(key => {
      const entry = cache.inspect(key)
      if (entry && (Date.now() - entry.createdAt) > maxAgeMs) {
        cache.delete(key)
        cleaned++
      }
    })
    
    if (cleaned > 0) {
      console.log(`[Cache] Manually cleaned ${cleaned} old entries`)
    }
    
    return cleaned
  },

  clearAll: () => {
    cache.clear()
    console.log(`[Cache] Cleared all caches`)
  },

  warmCache: async (userId: string, recentJobIds: string[]) => {
    console.log(`[Cache] Warming cache for user: ${sanitizeForLog(userId)} with ${recentJobIds.length} jobs`)
  },
}

export function withCacheInvalidation<T>(
  handler: () => Promise<T>,
  invalidationFn: () => void
): Promise<T> {
  return handler().then(result => {
    invalidationFn()
    return result
  })
}

export const cacheEventHandlers = {
  onJobStatusChange: (jobId: string, newStatus: string, userId?: string) => {
    if (newStatus === 'completed' || newStatus === 'failed') {
      cacheInvalidation.invalidateJob(jobId, userId)
    }
  },

  onHistoryCreate: (userId: string) => {
    cacheInvalidation.invalidateHistory(userId)
  },

  onHistoryDelete: (userId: string, historyId: string) => {
    cacheInvalidation.invalidateHistory(userId, historyId)
  },

  onUserUpdate: (userId: string) => {
    cache.delete(cacheKeys.user(userId))
  },
}

export default cacheInvalidation
