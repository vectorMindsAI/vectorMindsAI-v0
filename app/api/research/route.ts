import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { city, apiKey, model } = await req.json()

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock research data
    const mockData = {
      city: city,
      country: getCountryForCity(city),
      population: Math.floor(Math.random() * 10000000) + 100000,
      area_km2: Math.floor(Math.random() * 1000) + 50,
      timezone: getTimezoneForCity(city),
      coordinates: {
        lat: (Math.random() * 180 - 90).toFixed(6),
        lng: (Math.random() * 360 - 180).toFixed(6),
      },
      research_timestamp: new Date().toISOString(),
      model_used: model || "Gemini Flash",
      enrichment_steps: 1,
      status: "success",
    }

    return NextResponse.json(mockData)
  } catch (error) {
    return NextResponse.json({ error: "Research failed" }, { status: 500 })
  }
}

function getCountryForCity(city: string): string {
  const cityCountryMap: Record<string, string> = {
    "san francisco": "United States",
    tokyo: "Japan",
    london: "United Kingdom",
    paris: "France",
    berlin: "Germany",
    sydney: "Australia",
    mumbai: "India",
    dubai: "United Arab Emirates",
  }
  return cityCountryMap[city.toLowerCase()] || "Unknown"
}

function getTimezoneForCity(city: string): string {
  const cityTimezoneMap: Record<string, string> = {
    "san francisco": "America/Los_Angeles",
    tokyo: "Asia/Tokyo",
    london: "Europe/London",
    paris: "Europe/Paris",
    berlin: "Europe/Berlin",
    sydney: "Australia/Sydney",
    mumbai: "Asia/Kolkata",
    dubai: "Asia/Dubai",
  }
  return cityTimezoneMap[city.toLowerCase()] || "UTC"
}
