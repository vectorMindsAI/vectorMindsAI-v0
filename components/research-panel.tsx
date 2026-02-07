"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Sparkles, ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { analytics } from "@/lib/analytics"
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
  fallbackModel?: string;
  criteria: any[];
}

interface Log {
  type: string;
  message: string;
  timestamp: number;
}

export function ResearchPanel({ apiKey, tavilyKey, model, criteria }: ResearchPanelProps) {
  const [cityInput, setCityInput] = useState("")
  const [status, setStatus] = useState<"idle" | "searching" | "waiting_for_selection" | "enriched">("idle")
  const [progress, setProgress] = useState(0)
  const [showLogs, setShowLogs] = useState(true)
  const [researchReport, setResearchReport] = useState<any>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [candidateLinks, setCandidateLinks] = useState<any[]>([])
  const [selectedDeepLinks, setSelectedDeepLinks] = useState<string[]>([])

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const saveToHistory = async (results: any) => {
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: cityInput,
          criteria: criteria,
          results: results,
          model: model,
          fallbackModel: undefined,
          status: "success",
        }),
      })
    } catch (error) {
      console.error("Failed to save to history:", error)
    }
  }

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

            // Track completion with output metrics
            const outputText = JSON.stringify(job.result || {});
            const outputLength = outputText.length;
            const duration = Date.now() - (job.startTime || Date.now());

            const trackingData = {
              query: cityInput,
              model: model,
              duration,
              success: true,
              resultsCount: job.result ? Object.keys(job.result).length : 0,
              outputLength,
              outputCharacters: outputLength,
            };

            console.log('Analytics - research_completed:', trackingData);

            analytics.track('research_completed', trackingData);

            // Track model usage
            const modelTrackingData = {
              model,
              operation: 'research',
              outputLength,
              duration,
              tokensEstimate: Math.ceil(outputLength / 4), // Rough estimate: 1 token ≈ 4 chars
            };

            console.log('Analytics - model_usage_tracked:', modelTrackingData);

            analytics.track('model_usage_tracked', modelTrackingData);

            // Save to history
            saveToHistory(job.result)
          } else if (job.status === "waiting_for_selection") {
            setStatus("waiting_for_selection")
            setCandidateLinks(job.candidateLinks || [])
          } else if (job.status === "failed") {
            setStatus("idle")
            if (pollingRef.current) clearInterval(pollingRef.current)
            toast.dismiss("research")
            toast.error("Research failed.")

            // Track failure
            analytics.track('research_failed', {
              query: cityInput,
              model: model,
              error: job.error || 'Unknown error',
            });
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

  // Rate Limit Toast Sync
  const lastLogTimeRef = useRef<number>(0);
  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      if (lastLog.timestamp > lastLogTimeRef.current) {
        lastLogTimeRef.current = lastLog.timestamp;
        if (lastLog.type === "ERROR" && lastLog.message.includes("Rate limit")) {
          toast.error("Rate limit hit! Job paused/retrying...");
        }
      }
    }
  }, [logs]);


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

    // Track search initiation
    const initiatedData = {
      query: cityInput,
      model: model,
      criteriaCount: criteria.length,
    };

    console.log('Analytics - research_initiated:', initiatedData);

    analytics.track('research_initiated', initiatedData);

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
            ? criteria.map(c => {
              if (c.outputSchema && c.outputSchema.length > 0) {
                const schemaStr = c.outputSchema.map((item: any) => `"${item.key}": "${item.description}"`).join(", ");
                return `${c.name}: ${c.description} [Output Format: { ${schemaStr} }]`;
              }
              return `${c.name}: ${c.description}`;
            })
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
              {status === "searching" && (
                <Button
                  onClick={async () => {
                    if (!jobId) return;
                    try {
                      await fetch("/api/research/cancel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jobId })
                      });
                      toast.error("Research stopped by user");
                      setStatus("idle");
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  variant="destructive"
                  className="w-full sm:w-auto text-sm"
                >
                  Stop
                </Button>
              )}
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

      {status === "waiting_for_selection" && (
        <Card className="border-primary/50 shadow-lg animate-in fade-in">
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Select Sources</CardTitle>
            <CardDescription>Select the links you want to analyze for deep research</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {candidateLinks.map((link, idx) => (
                <div key={idx} className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    id={`link-${idx}`}
                    className="mt-1"
                    onChange={(e) => {
                      const set = new Set(selectedDeepLinks);
                      if (e.target.checked) set.add(link.url);
                      else set.delete(link.url);
                      setSelectedDeepLinks(Array.from(set));
                    }}
                  />
                  <label htmlFor={`link-${idx}`} className="text-sm cursor-pointer leading-snug">
                    <div className="font-semibold text-primary/80">{link.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{link.url}</div>
                  </label>
                </div>
              ))}
            </div>
            <Button
              onClick={async () => {
                if (selectedDeepLinks.length === 0) {
                  toast.error("Please select at least one link");
                  return;
                }
                try {
                  await fetch("/api/research/extended/selection", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      jobId,
                      selectedLinks: selectedDeepLinks
                    })
                  });
                  setStatus("searching");
                  toast.success("Selection submitted. Continuing research...");
                } catch (e) {
                  toast.error("Failed to submit selection");
                }
              }}
              className="w-full"
            >
              Continue Research ({selectedDeepLinks.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "enriched" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Extended Research
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">
              Deep dive into specific criteria using custom URLs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="extended-criteria" className="text-xs">Target Criterion</Label>
                <select
                  id="extended-criteria"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => {
                    const c = criteria.find(c => c.name === e.target.value);
                    if (c) {
                    }
                  }}
                >
                  <option value="">Select a criterion...</option>
                  {criteria.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extended-url" className="text-xs">Source URL (Optional)</Label>
                <Input id="extended-url" placeholder="https://example.com/data" className="h-9" />
              </div>
            </div>
            <Button
              onClick={async () => {
                const criterionName = (document.getElementById("extended-criteria") as HTMLSelectElement).value;
                const url = (document.getElementById("extended-url") as HTMLInputElement).value;

                if (!criterionName) {
                  toast.error("Please select a criterion");
                  return;
                }

                const selectedCriterion = criteria.find(c => c.name === criterionName);
                if (!selectedCriterion) return;

                toast.loading("Starting extended research...", { id: "extended" });
                try {
                  const res = await fetch("/api/research/extended", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      jobId: jobId,
                      city: cityInput,
                      apiKey,
                      tavilyKey,
                      model,
                      criteria: [selectedCriterion],
                      sourceUrl: url
                    })
                  });
                  const data = await res.json();
                  if (data.jobId) {
                    setJobId(data.jobId);
                    setStatus("searching");
                    setProgress(0);
                    setLogs([]);
                    toast.dismiss("extended");
                    toast.success("Extended research started");
                  }
                } catch (e) {
                  toast.dismiss("extended");
                  toast.error("Failed to start extended research");
                }
              }}
              className="w-full sm:w-auto text-sm"
            >
              Start Deep Dive
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

