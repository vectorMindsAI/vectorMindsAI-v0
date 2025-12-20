"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Sparkles, ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ResearchPanelProps {
  apiKey: string;
  tavilyKey: string;
  model: string;
  criteria: any[];
}

interface Log {
  type: string;
  message: string;
  timestamp: number;
}

export function ResearchPanel({ apiKey, tavilyKey, model, criteria }: ResearchPanelProps) {
  const [cityInput, setCityInput] = useState("")
  const [status, setStatus] = useState<"idle" | "searching" | "enriched">("idle")
  const [progress, setProgress] = useState(0)
  const [showLogs, setShowLogs] = useState(true)
  const [researchReport, setResearchReport] = useState<any>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  useEffect(() => {
    if (jobId && status === "searching") {
      const pollStatus = async () => {
        try {
          const res = await fetch(`/api/research/status?id=${jobId}`)
          if (!res.ok) return

          const job = await res.json()
          setProgress(job.progress)
          setLogs(job.logs || [])

          if (job.status === "completed") {
             setStatus("enriched")
             setResearchReport(job.result)
             if (pollingRef.current) clearInterval(pollingRef.current)
             toast.dismiss("research")
             toast.success("Research completed!")
          } else if (job.status === "failed") {
            setStatus("idle")
            if (pollingRef.current) clearInterval(pollingRef.current)
            toast.dismiss("research")
            toast.error("Research failed.")
          }
        } catch (e) {
          console.error("Polling error", e)
        }
      }

      pollingRef.current = setInterval(pollStatus, 1000)
    }
    return () => {
        if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [jobId, status])


  const handleSearch = async () => {
    if (!cityInput.trim()) {
      toast.error("Please enter a city name")
      return
    }

    if (!apiKey || !tavilyKey) {
        toast.error("Please provide both Groq and Tavily API keys in the settings sidebar.")
        return
    }

    setStatus("searching")
    setProgress(0)
    setLogs([])
    setResearchReport(null)
    toast.loading("Starting research...", { id: "research" })

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityInput,
          apiKey,
          tavilyKey,
          model: model,
          criteria: criteria.length > 0 
            ? criteria.map(c => `${c.name}: ${c.description}`)
            : ["General: Comprehensive city overview including population, weather, and key facts."],
        }),
      })

      const data = await response.json()
      if (data.jobId) {
        setJobId(data.jobId)
      } else {
        throw new Error("No Job ID returned")
      }
    } catch (error) {
      setStatus("idle")
      setProgress(0)
      toast.dismiss("research")
      toast.error("Research failed to start.")
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
    a.download = `${cityInput.toLowerCase().replace(/\s+/g, "-")}-research-report.json`
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
                {status === "searching" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {status === "searching" ? "Researching..." : "Start Researching"}
              </Button>
            </div>
          </div>

          {status !== "idle" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs lg:text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
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
                  <h3 className="font-semibold text-sm lg:text-base truncate">{cityInput || "City"}</h3>
                  <Badge variant={status === "enriched" ? "default" : "secondary"} className="text-xs shrink-0">
                    {status === "searching" ? "Searching..." : "Enriched"}
                  </Badge>
                </div>
                <p className="text-xs lg:text-sm text-muted-foreground">Model: {model}</p>
              </div>
              {status === "enriched" && <Sparkles className="h-6 w-6 lg:h-8 lg:w-8 text-primary shrink-0" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Logs - Always visible during search */}
      {(status === "searching" || (status === "enriched" && logs.length > 0)) && (
        <Card>
          <CardHeader>
            <button onClick={() => setShowLogs(!showLogs)} className="flex w-full items-center justify-between text-left">
              <CardTitle className="text-base lg:text-lg">Live Activity Logs</CardTitle>
              {showLogs ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </button>
          </CardHeader>
          {showLogs && (
            <CardContent>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                {logs.length === 0 && <p className="text-sm text-muted-foreground">Initializing...</p>}
                {logs.slice().reverse().map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs lg:text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Badge variant={log.type === "INFO" ? "secondary" : log.type === "SUCCESS" ? "default" : "outline"} className="mt-0.5 text-[10px] shrink-0">
                        {log.type}
                        </Badge>
                        <span className="text-muted-foreground break-words">{log.message}</span>
                    </div>
                ))}
              </div>
            </CardContent>
          )}
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
    </div>
  )
}

