import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import AgentJob from "@/lib/models/AgentJob"
import { databaseLimiter } from "@/lib/rate-limit"
import { cache, cacheKeys, cacheTTL } from "@/lib/cache"

export async function GET(req: NextRequest) {
  const rateLimitResponse = await databaseLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  let session: any = null
  try {
    session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")

    const cacheKey = cacheKeys.userJobs(session.user.id + `:${page}:${limit}:${status || 'all'}`)
    const cachedJobs = cache.get<any>(cacheKey)
    
    if (cachedJobs) {
      return NextResponse.json(cachedJobs)
    }

    await dbConnect()

    const query: any = { userId: session.user.id }

    if (status) {
      query.status = status
    }

    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      AgentJob.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AgentJob.countDocuments(query),
    ])

    const response = {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    cache.set(cacheKey, response, cacheTTL.agentJob)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching agent jobs:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "agent-jobs-get", action: "fetch" },
      extra: { userId: session?.user?.id },
    })
    return NextResponse.json({ error: "Failed to fetch agent jobs" }, { status: 500 })
  }
}
