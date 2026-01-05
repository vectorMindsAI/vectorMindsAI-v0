import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import { standardLimiter } from "@/lib/rate-limit"
import { cacheInvalidation } from "@/lib/cache-invalidation"

export async function POST(req: NextRequest) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      )
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { action, ...params } = body

    let result: any = { success: true }

    switch (action) {
      case 'invalidate_user':
        if (!params.userId) {
          return NextResponse.json({ error: "userId required" }, { status: 400 })
        }
        cacheInvalidation.invalidateUser(params.userId)
        result.message = `Invalidated all caches for user: ${params.userId}`
        break

      case 'invalidate_job':
        if (!params.jobId) {
          return NextResponse.json({ error: "jobId required" }, { status: 400 })
        }
        cacheInvalidation.invalidateJob(params.jobId, params.userId)
        result.message = `Invalidated job: ${params.jobId}`
        break

      case 'invalidate_history':
        if (!params.userId) {
          return NextResponse.json({ error: "userId required" }, { status: 400 })
        }
        cacheInvalidation.invalidateHistory(params.userId, params.historyId)
        result.message = `Invalidated history for user: ${params.userId}`
        break

      case 'invalidate_research':
        if (!params.query) {
          return NextResponse.json({ error: "query required" }, { status: 400 })
        }
        cacheInvalidation.invalidateResearch(params.query, params.criteria)
        result.message = `Invalidated research: ${params.query}`
        break

      case 'invalidate_old':
        const maxAge = params.maxAgeMs || 60 * 60 * 1000 // 1 hour default
        const cleaned = cacheInvalidation.invalidateOldEntries(maxAge)
        result.message = `Cleaned ${cleaned} old cache entries`
        result.cleaned = cleaned
        break

      case 'clear_all':
        cacheInvalidation.clearAll()
        result.message = "Cleared all caches"
        result.warning = "This clears ALL cached data - use with caution!"
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { 
        endpoint: '/api/cache/invalidate',
        action: 'cache_invalidation'
      },
    })

    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      )
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      actions: [
        {
          action: "invalidate_user",
          description: "Invalidate all caches for a specific user",
          params: { userId: "required" }
        },
        {
          action: "invalidate_job",
          description: "Invalidate cache for a specific job",
          params: { jobId: "required", userId: "optional" }
        },
        {
          action: "invalidate_history",
          description: "Invalidate search history cache for a user",
          params: { userId: "required", historyId: "optional" }
        },
        {
          action: "invalidate_research",
          description: "Invalidate research cache for a query",
          params: { query: "required", criteria: "optional" }
        },
        {
          action: "invalidate_old",
          description: "Clean cache entries older than specified age",
          params: { maxAgeMs: "optional (default: 3600000 = 1 hour)" }
        },
        {
          action: "clear_all",
          description: "Clear ALL caches (use with caution)",
          params: {}
        }
      ],
      examples: [
        {
          description: "Invalidate user caches",
          request: {
            action: "invalidate_user",
            userId: "user123"
          }
        },
        {
          description: "Invalidate specific job",
          request: {
            action: "invalidate_job",
            jobId: "job-uuid",
            userId: "user123"
          }
        },
        {
          description: "Clean old entries (older than 2 hours)",
          request: {
            action: "invalidate_old",
            maxAgeMs: 7200000
          }
        }
      ]
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { 
        endpoint: '/api/cache/invalidate',
        action: 'get_actions'
      },
    })

    return NextResponse.json(
      { error: "Failed to fetch invalidation actions" },
      { status: 500 }
    )
  }
}
