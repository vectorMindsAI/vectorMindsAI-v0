import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { collections } = await req.json()

    // Simulate fetch delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate mock documents with various fields
    const mockDocuments = collections.flatMap((collection: string) => {
      return Array.from({ length: 3 }, (_, i) => ({
        _id: `${collection}_${i + 1}`,
        collection: collection,
        ...generateMockFields(collection),
      }))
    })

    // Extract unique fields
    const uniqueFields = new Set<string>()
    mockDocuments.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        if (key !== "_id" && key !== "collection") {
          uniqueFields.add(key)
        }
      })
    })

    return NextResponse.json({
      documents: mockDocuments,
      fields: Array.from(uniqueFields).sort(),
      count: mockDocuments.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
  }
}

function generateMockFields(collection: string): Record<string, any> {
  const baseFields = {
    name: `Sample ${collection}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const collectionSpecificFields: Record<string, Record<string, any>> = {
    cities: {
      city_name: "San Francisco",
      country: "USA",
      population: 873965,
      area_km2: 121.4,
    },
    countries: {
      country_name: "United States",
      continent: "North America",
      population: 331900000,
      gdp_billions: 21433,
    },
    demographics: {
      median_age: 38.5,
      birth_rate: 12.5,
      death_rate: 8.9,
      urban_population_percent: 82.7,
    },
    economic_data: {
      gdp_per_capita: 65298,
      unemployment_rate: 3.8,
      inflation_rate: 2.3,
      main_industries: ["Technology", "Finance"],
    },
    climate_data: {
      avg_temperature: 15.5,
      annual_rainfall_mm: 600,
      climate_type: "Mediterranean",
      seasons: 4,
    },
    infrastructure: {
      airports: 3,
      metro_lines: 8,
      highway_km: 450,
      internet_penetration_percent: 95,
    },
  }

  return {
    ...baseFields,
    ...(collectionSpecificFields[collection] || {}),
  }
}
