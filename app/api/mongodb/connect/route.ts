import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { mongoUrl } = await req.json()

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock database collections
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
