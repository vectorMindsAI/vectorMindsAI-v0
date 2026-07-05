import { type NextRequest, NextResponse } from "next/server"
import { standardLimiter } from "@/lib/rate-limit"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  let conn: mongoose.Connection | null = null

  try {
    const { mongoUrl } = await req.json()

    if (!mongoUrl || typeof mongoUrl !== "string") {
      return NextResponse.json({ error: "Missing mongoUrl" }, { status: 400 })
    }

    conn = mongoose.createConnection(mongoUrl, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    })

    await conn.asPromise()
    const db = conn.db
    if (!db) throw new Error("Could not access database")

    const collectionInfos = await db.listCollections().toArray()
    const collections = collectionInfos.map((c) => c.name).sort()

    return NextResponse.json({
      status: "connected",
      collections,
      database: db.databaseName,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
}
