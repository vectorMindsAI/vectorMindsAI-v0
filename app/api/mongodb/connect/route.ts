import { type NextRequest, NextResponse } from "next/server"
import { standardLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    await req.json()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const mockCollections = ["cities", "countries", "demographics", "economic_data", "climate_data", "infrastructure"]

    return NextResponse.json({
      status: "connected",
      collections: mockCollections,
      database: "city_research_db",
    })
  } catch (error) {
    return NextResponse.json({ error: "Connection failed" }, { status: 500 })
  }
}
