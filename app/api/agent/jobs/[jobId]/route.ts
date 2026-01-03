import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import AgentJob from "@/lib/models/AgentJob"
import { jobStore } from "@/lib/store"
import { standardLimiter } from "@/lib/rate-limit"
import { cache, cacheKeys, cacheTTL } from "@/lib/cache"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await auth()
    const { jobId } = await params

    const cacheKey = cacheKeys.agentJob(jobId)
    const cachedJob = cache.get<any>(cacheKey)
    
    if (cachedJob) {
      return NextResponse.json(cachedJob)
    }

    const job = await jobStore.get(jobId)

    if (job) {
      cache.set(cacheKey, job, cacheTTL.agentJob)
      return NextResponse.json(job)
    }

    if (session?.user?.id) {
      await dbConnect()

      const dbJob = await AgentJob.findOne({
        jobId,
        userId: session.user.id,
      }).lean()

      if (!dbJob) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }

      cache.set(cacheKey, dbJob, cacheTTL.agentJob)
      return NextResponse.json(dbJob)
    }

    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching agent job:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "agent-job-get-id", action: "fetch-single" },
      extra: { jobId: (await params).jobId },
    })
    return NextResponse.json({ error: "Failed to fetch agent job" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { jobId } = await params

    const result = await AgentJob.deleteOne({
      jobId,
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    cache.delete(cacheKeys.agentJob(jobId))
    cache.deletePattern(`agent:jobs:${session.user.id}:.*`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting agent job:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "agent-job-delete", action: "delete" },
      extra: { jobId: (await params).jobId },
    })
    return NextResponse.json({ error: "Failed to delete agent job" }, { status: 500 })
  }
}
