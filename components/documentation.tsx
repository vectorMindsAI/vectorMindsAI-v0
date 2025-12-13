import { BookOpen, Sparkles, Target, Layers, Code } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Documentation() {
  const sections = [
    {
      icon: Sparkles,
      title: "How the Agent Works",
      content:
        "The AI City Research Agent uses a multi-step enrichment process to gather comprehensive data about cities. It starts with a primary search, analyzes completeness, and automatically fills gaps using advanced AI models.",
    },
    {
      icon: Target,
      title: "What is Gap-Filling?",
      content:
        "Gap-filling is the process of detecting missing or incomplete data fields and automatically enriching them. The agent identifies what's missing and uses targeted searches to complete your dataset.",
    },
    {
      icon: Layers,
      title: "Adding Custom Criteria",
      content:
        "Use the Criteria Builder to define custom fields specific to your research needs. The agent will automatically incorporate these into its enrichment pipeline and search for relevant data.",
    },
    {
      icon: Code,
      title: "External Resources",
      content:
        "When you have specific URLs or documents with relevant data, use the Resource Injector to guide the agent. This ensures accurate data extraction from your trusted sources.",
    },
  ]

  const examples = [
    {
      title: "Basic City Research",
      description: "Search for 'Paris' and get population, area, timezone, and more",
    },
    {
      title: "Custom Enrichment",
      description: "Add 'Tech Companies' as custom criteria to find startup ecosystems",
    },
    {
      title: "Resource Injection",
      description: "Provide a World Bank URL to populate GDP data accurately",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to AI City Research Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-foreground">
            This multi-step enrichment engine helps you gather comprehensive data about cities around the world. Using
            advanced AI models, the agent automatically detects gaps in your data and fills them with accurate,
            up-to-date information.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Whether you're researching for business, academics, or personal projects, this tool streamlines the data
            collection process and ensures you have complete, reliable city information.
          </p>
        </CardContent>
      </Card>

      {/* Key Concepts */}
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {examples.map((example, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold text-foreground">{example.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{example.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </span>
              <span className="text-foreground">Configure your API key and select a model in Settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                2
              </span>
              <span className="text-foreground">Go to Research Panel and enter a city name</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                3
              </span>
              <span className="text-foreground">Review results and use gap-filling to complete missing fields</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                4
              </span>
              <span className="text-foreground">Add custom criteria or inject external resources as needed</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
