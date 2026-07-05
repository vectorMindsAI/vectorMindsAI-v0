import { type NextRequest, NextResponse } from "next/server"
import { standardLimiter } from "@/lib/rate-limit"
import mongoose from "mongoose"

const SAMPLE_LIMIT = 5

export async function POST(req: NextRequest) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  let conn: mongoose.Connection | null = null

  try {
    const { mongoUrl, collections } = await req.json()

    if (!mongoUrl || typeof mongoUrl !== "string") {
      return NextResponse.json({ error: "Missing mongoUrl" }, { status: 400 })
    }
    if (!Array.isArray(collections) || collections.length === 0) {
      return NextResponse.json({ error: "Missing collections array" }, { status: 400 })
    }

    conn = mongoose.createConnection(mongoUrl, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    })
    await conn.asPromise()
    const db = conn.db
    if (!db) throw new Error("Could not access database")

    const allDocuments: Record<string, unknown>[] = []
    const uniqueFields = new Set<string>()

    for (const collectionName of collections) {
      const docs = await db
        .collection(collectionName)
        .find({}, { projection: { __v: 0 } })
        .limit(SAMPLE_LIMIT)
        .toArray()

      for (const doc of docs) {
        const serialized = JSON.parse(JSON.stringify(doc, (_key, val) =>
          // Convert ObjectId / Buffer to string so it's serialisable
          val != null && typeof val === "object" && typeof val.toString === "function" && val.constructor?.name !== "Object" && val.constructor?.name !== "Array"
            ? val.toString()
            : val
        ))
        serialized.collection = collectionName
        allDocuments.push(serialized)
        Object.keys(serialized).forEach((key) => {
          if (key !== "_id" && key !== "collection") uniqueFields.add(key)
        })
      }
    }

    return NextResponse.json({
      documents: allDocuments,
      fields: Array.from(uniqueFields).sort(),
      count: allDocuments.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed"
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    if (conn) {
      await conn.close().catch(() => {})
    }
  }
}
