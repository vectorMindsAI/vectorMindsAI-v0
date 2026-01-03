import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import SearchHistory from "@/lib/models/SearchHistory"

export async function POST(req: NextRequest) {
  let session: any = null
  try {
    session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { query, criteria, results, model, fallbackModel, status } = body

    if (!query || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const jsonString = JSON.stringify(results)
    const sizeKB = Buffer.byteLength(jsonString, "utf8") / 1024

    if (sizeKB > 15 * 1024) {
      return NextResponse.json({ error: "Response too large to store (>15MB)" }, { status: 413 })
    }

    await dbConnect()

    const history = await SearchHistory.create({
      userId: session.user.id,
      query,
      criteria: criteria || [],
      results,
      model: model || "unknown",
      fallbackModel,
      status: status || "success",
      sizeKB: parseFloat(sizeKB.toFixed(2)),
    })

    return NextResponse.json({ success: true, id: history._id }, { status: 201 })
  } catch (error) {
    console.error("Error saving search history:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "history-post", action: "save" },
      extra: { userId: session?.user?.id }
    });
    return NextResponse.json({ error: "Failed to save search history" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  let session: any = null
  let page = 1
  let limit = 20
  try {
    session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    page = parseInt(searchParams.get("page") || "1")
    limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    await dbConnect()

    const query: any = { userId: session.user.id }

    if (search) {
      query.query = { $regex: search, $options: "i" }
    }

    const skip = (page - 1) * limit

    const [history, total] = await Promise.all([
      SearchHistory.find(query)
        .select("-results")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SearchHistory.countDocuments(query),
    ])

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching search history:", error)
    Sentry.captureException(error, {
      tags: { endpoint: "history-get", action: "fetch" },
      extra: { userId: session?.user?.id, page, limit }
    });
    return NextResponse.json({ error: "Failed to fetch search history" }, { status: 500 })
  }
}
