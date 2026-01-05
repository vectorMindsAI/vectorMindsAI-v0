import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import { cache } from "@/lib/cache"
import { standardLimiter } from "@/lib/rate-limit"

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

    const stats = cache.getStats()
    const entries = cache.getEntries()
    
    const totalRequests = stats.totalHits + stats.totalMisses
    const hitRate = totalRequests > 0 
      ? ((stats.totalHits / totalRequests) * 100).toFixed(2)
      : '0.00'

    const memoryMB = (stats.memoryUsage / 1024 / 1024).toFixed(2)

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          totalEntries: stats.totalEntries,
          totalHits: stats.totalHits,
          totalMisses: stats.totalMisses,
          hitRate: `${hitRate}%`,
          memoryUsageMB: `${memoryMB} MB`,
          memoryUsageBytes: stats.memoryUsage,
        },
        timestamps: {
          oldestEntry: stats.oldestEntry ? new Date(stats.oldestEntry).toISOString() : null,
          newestEntry: stats.newestEntry ? new Date(stats.newestEntry).toISOString() : null,
        },
        performance: {
          efficiency: hitRate,
          recommendation: getRecommendation(parseFloat(hitRate), stats.totalEntries),
        },
        entries,
      },
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { 
        endpoint: '/api/cache/stats',
        action: 'get_stats'
      },
    })

    return NextResponse.json(
      { error: "Failed to fetch cache statistics" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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

    const { pattern } = await req.json().catch(() => ({}))

    let cleared = 0

    if (pattern) {
      cleared = cache.deletePattern(pattern)
    } else {
      cache.clear()
      cleared = -1 
    }

    return NextResponse.json({
      success: true,
      message: cleared === -1 
        ? "Cache cleared completely"
        : `Cleared ${cleared} cache entries`,
      cleared: cleared === -1 ? 'all' : cleared,
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { 
        endpoint: '/api/cache/stats',
        action: 'clear_cache'
      },
    })

    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    )
  }
}

function getRecommendation(hitRate: number, entries: number): string {
  if (entries === 0) {
    return "No cache entries yet. Cache will populate as requests are made."
  }
  
  if (hitRate >= 70) {
    return "Excellent cache performance! Most requests are being served from cache."
  } else if (hitRate >= 40) {
    return "Good cache performance. Consider increasing TTL for frequently accessed data."
  } else if (hitRate >= 20) {
    return "Moderate cache performance. Review cache keys and TTL settings."
  } else {
    return "Low cache hit rate. Consider caching more endpoints or increasing TTL."
  }
}
