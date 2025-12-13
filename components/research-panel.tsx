"use client"

import { useState } from "react"
import { Search, Sparkles, ChevronDown, ChevronRight, Download } from "lucide-react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function ResearchPanel() {
  const [cityInput, setCityInput] = useState("")
  const [status, setStatus] = useState<"idle" | "searching" | "enriched">("idle")
  const [progress, setProgress] = useState(0)
  const [showLogs, setShowLogs] = useState(false)
  const [researchReport, setResearchReport] = useState<any>(null)

  const handleSearch = async () => {
    if (!cityInput.trim()) {
      toast.error("Please enter a city name")
      return
    }

    setStatus("searching")
    setProgress(30)
    toast.loading("Starting research...", { id: "research" })

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityInput,
          apiKey: "mock-api-key",
          model: "Gemini Flash",
        }),
      })

      setProgress(70)
      toast.loading("Fetching data...", { id: "research" })

      const data = await response.json()

      setProgress(100)
      setStatus("enriched")
      setResearchReport(data)
      toast.success("Research completed!", { id: "research" })
    } catch (error) {
      setStatus("idle")
      setProgress(0)
      toast.error("Research failed. Please try again.", { id: "research" })
    }
  }

  const handleEnrich = async () => {
    if (!researchReport) {
      toast.error("No data to enrich")
      return
    }

    setStatus("searching")
    setProgress(50)
    toast.loading("Enriching data...", { id: "enrich" })

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityInput,
          currentData: researchReport,
          fields: ["gdp", "climate", "industries"],
        }),
      })

      const data = await response.json()

      setProgress(100)
      setStatus("enriched")
      setResearchReport(data)
      toast.success("Data enriched successfully!", { id: "enrich" })
    } catch (error) {
      toast.error("Enrichment failed. Please try again.", { id: "enrich" })
    }
  }

  const handleDownloadReport = () => {
    if (!researchReport) {
      toast.error("No research report available")
      return
    }

    const blob = new Blob([JSON.stringify(researchReport, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${researchReport.city.toLowerCase().replace(/\s+/g, "-")}-research-report.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Report downloaded successfully!")
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* City Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">City Research</CardTitle>
          <CardDescription className="text-xs lg:text-sm">
            Enter a city name to begin multi-step enrichment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs lg:text-sm">
              City Name
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="city"
                placeholder="e.g., San Francisco, Tokyo, London"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleSearch}
                disabled={!cityInput || status === "searching"}
                className="w-full sm:w-auto text-sm"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          {status !== "idle" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs lg:text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Card */}
      {status !== "idle" && (
        <Card>
          <CardContent className="pt-4 lg:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm lg:text-base truncate">{cityInput || "San Francisco"}</h3>
                  <Badge variant={status === "enriched" ? "default" : "secondary"} className="text-xs shrink-0">
                    {status === "searching" ? "Searching..." : "Enriched"}
                  </Badge>
                </div>
                <p className="text-xs lg:text-sm text-muted-foreground">Model: Gemini Flash</p>
              </div>
              {status === "enriched" && <Sparkles className="h-6 w-6 lg:h-8 lg:w-8 text-primary shrink-0" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* JSON Preview */}
      {status === "enriched" && researchReport && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base lg:text-lg">Research Results</CardTitle>
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-xs bg-transparent"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-3 lg:p-4 font-mono text-[10px] lg:text-xs overflow-auto max-h-64 lg:max-h-96">
              <pre className="text-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(researchReport, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Fields Detector */}
      {status === "enriched" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Missing Fields Detected</CardTitle>
            <CardDescription className="text-xs lg:text-sm">
              The following fields are missing or incomplete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {["GDP", "Climate Data", "Top Industries"].map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-2.5 lg:p-3"
                >
                  <span className="text-xs lg:text-sm font-medium">{field}</span>
                  <Badge variant="outline" className="text-xs">
                    Missing
                  </Badge>
                </div>
              ))}
            </div>
            <Button onClick={handleEnrich} className="w-full text-sm lg:text-base">
              <Sparkles className="mr-2 h-4 w-4" />
              Fill Missing Fields
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <button onClick={() => setShowLogs(!showLogs)} className="flex w-full items-center justify-between text-left">
            <CardTitle className="text-base lg:text-lg">Activity Logs</CardTitle>
            {showLogs ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          </button>
        </CardHeader>
        {showLogs && (
          <CardContent className="space-y-2">
            {[
              { type: "INFO", message: `Search initiated for ${cityInput || "city"}` },
              { type: "STEP", message: "Fetching primary data from sources" },
              { type: "STEP", message: "Analyzing data completeness" },
              { type: "ENRICHED", message: "Primary data retrieval complete" },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs lg:text-sm">
                <Badge variant={log.type === "INFO" ? "secondary" : "default"} className="mt-0.5 text-xs shrink-0">
                  {log.type}
                </Badge>
                <span className="text-muted-foreground break-words">{log.message}</span>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
