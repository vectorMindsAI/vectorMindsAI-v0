import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import SearchHistory from "@/lib/models/SearchHistory"
import { databaseLimiter } from "@/lib/rate-limit"
import { cache, cacheKeys, cacheTTL } from "@/lib/cache"
import { cacheInvalidation } from "@/lib/cache-invalidation"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await databaseLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params

    const cacheKey = cacheKeys.searchHistoryItem(id)
    const cachedHistory = cache.get<any>(cacheKey)
    
    if (cachedHistory) {
      return NextResponse.json(cachedHistory)
    }

    const history = await SearchHistory.findOne({
      _id: id,
      userId: session.user.id,
    }).lean()

    if (!history) {
      return NextResponse.json({ error: "History not found" }, { status: 404 })
    }

    cache.set(cacheKey, history, cacheTTL.searchHistory)

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching search history:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "history-get-id", action: "fetch-single" },
      extra: { historyId: (await params).id }
    });
    return NextResponse.json({ error: "Failed to fetch search history" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await databaseLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params

    const result = await SearchHistory.deleteOne({
      _id: id,
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "History not found" }, { status: 404 })
    }

    cacheInvalidation.invalidateHistory(session.user.id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting search history:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "history-delete", action: "delete" },
      extra: { historyId: (await params).id }
    });
    return NextResponse.json({ error: "Failed to delete search history" }, { status: 500 })
  }
}
