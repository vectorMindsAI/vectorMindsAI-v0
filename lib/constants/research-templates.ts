export interface OutputSchemaItem {
  key: string
  description: string
}

export interface Criterion {
  id: string
  name: string
  description: string
  outputSchema: OutputSchemaItem[]
}

export interface ResearchTemplate {
  id: string
  name: string
  description: string
  criteria: Omit<Criterion, "id">[]
}

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: "city-overview",
    name: "🏙️ City Overview",
    description: "General statistics, weather, demographics, and key facts.",
    criteria: [
      {
        name: "General Statistics",
        description: "Population, area size, density, and timezone",
        outputSchema: [
          { key: "population", description: "Total population" },
          { key: "area_sq_km", description: "Area in square kilometers" },
          { key: "timezone", description: "Timezone name/offset" }
        ]
      },
      {
        name: "Weather & Climate",
        description: "Annual weather patterns, best time to visit",
        outputSchema: [
          { key: "avg_temp_summer", description: "Average summer temperature (C)" },
          { key: "avg_temp_winter", description: "Average winter temperature (C)" },
          { key: "rainy_season", description: "Months with highest rainfall" }
        ]
      },
      {
        name: "History & Culture",
        description: "Brief history and cultural significance",
        outputSchema: []
      }
    ]
  },
  {
    id: "travel-tourism",
    name: "✈️ Travel & Tourism",
    description: "Top attractions, transport, budget, and safety.",
    criteria: [
      {
        name: "Top Attractions",
        description: "Must-visit places and landmarks",
        outputSchema: [
          { key: "landmarks", description: "List of top 3-5 landmarks" },
          { key: "ticket_prices", description: "Approximate entry fees" }
        ]
      },
      {
        name: "Transportation",
        description: "Public transport options and costs",
        outputSchema: [
          { key: "metro_available", description: "Yes/No" },
          { key: "avg_taxi_fare", description: "Cost per km or typical ride" },
          { key: "airport_transfer", description: "Options to city center" }
        ]
      },
      {
        name: "Safety & Scams",
        description: "Safety advice for tourists",
        outputSchema: []
      }
    ]
  },
  {
    id: "living-relocation",
    name: "🏠 Living & Relocation",
    description: "Cost of living, housing, healthcare, and education.",
    criteria: [
      {
        name: "Cost of Living",
        description: "Monthly expenses for a single person and family",
        outputSchema: [
          { key: "rent_1hk_center", description: "Rent for 1-bedroom apt in city center" },
          { key: "meal_budget", description: "Cost of inexpensive meal" },
          { key: "monthly_pass", description: "Monthly transport pass price" }
        ]
      },
      {
        name: "Neighborhoods",
        description: "Best areas to live for families and singles",
        outputSchema: []
      },
      {
        name: "Healthcare",
        description: "Quality of hospitals and insurance needs",
        outputSchema: []
      }
    ]
  },
  {
    id: "business-investment",
    name: "💼 Business & Investment",
    description: "Economy, key industries, startups, and taxes.",
    criteria: [
        {
            name: "Economy Overview",
            description: "GDP, major industries, and growth rate",
            outputSchema: [
                { key: "gdp_per_capita", description: "GDP per capita in USD" },
                { key: "major_industries", description: "List of top industries" }
            ]
        },
        {
            name: "Startup Ecosystem",
            description: "Support for startups, accelerators, and funding",
            outputSchema: []
        },
        {
            name: "Taxation",
            description: "Corporate and personal tax rates",
            outputSchema: [
                { key: "corporate_tax", description: "Corporate tax rate %" },
                { key: "income_tax", description: "Personal income tax range" }
            ]
        }
    ]
  },
  {
    id: "food-culture",
    name: "🍜 Food & Culture",
    description: "Local cuisine, festivals, dining etiquette, and nightlife.",
    criteria: [
        {
            name: "Local Cuisine",
            description: "Famous dishes and street food",
            outputSchema: [
                { key: "must_try_dishes", description: "List of signature dishes" },
                { key: "street_food", description: "Popular street food items" }
            ]
        },
        {
            name: "Dining Etiquette",
            description: "Tipping rules and table manners",
            outputSchema: []
        },
        {
            name: "Festivals",
            description: "Major annual festivals and events",
            outputSchema: []
        }
    ]
  }
]
