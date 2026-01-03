import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import AgentJob from "@/lib/models/AgentJob"
import { jobStore } from "@/lib/store"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth()
    const { jobId } = await params

    // First try file-based store for real-time data
    const job = await jobStore.get(jobId)

    if (job) {
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
