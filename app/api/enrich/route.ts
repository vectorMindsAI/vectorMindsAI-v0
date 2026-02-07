import { type NextRequest, NextResponse } from "next/server"
import { standardLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const rateLimitResponse = await standardLimiter(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { currentData, fields } = await req.json()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const enrichmentData: Record<string, any> = {
      gdp_billions: (Math.random() * 500 + 50).toFixed(2),
      gdp_per_capita: (Math.random() * 80000 + 20000).toFixed(2),
      climate: ["Tropical", "Temperate", "Mediterranean", "Continental", "Arid"][Math.floor(Math.random() * 5)],
      top_industries: generateRandomIndustries(),
      unemployment_rate: (Math.random() * 10 + 2).toFixed(1),
      median_age: Math.floor(Math.random() * 20 + 25),
      literacy_rate: (Math.random() * 10 + 90).toFixed(1),
      avg_temperature: (Math.random() * 30 + 5).toFixed(1),
    }

    const enrichedData = {
      ...currentData,
      ...enrichmentData,
      enrichment_steps: (currentData.enrichment_steps || 0) + 1,
      last_enriched: new Date().toISOString(),
    }

    return NextResponse.json(enrichedData)
  } catch (error) {
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 })
  }
}

function generateRandomIndustries() {
  const allIndustries = [
    "Technology",
    "Finance",
    "Tourism",
    "Manufacturing",
    "Healthcare",
    "Education",
    "Retail",
    "Real Estate",
    "Transportation",
    "Entertainment",
  ]
  const count = Math.floor(Math.random() * 3) + 3
  return allIndustries.sort(() => Math.random() - 0.5).slice(0, count)
}
