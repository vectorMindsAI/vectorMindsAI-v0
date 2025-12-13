"use client"

import { BarChart3, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AnalyticsLogs() {
  const stats = [
    { label: "Total Researches", value: "147", icon: BarChart3, color: "text-blue-500" },
    { label: "Avg. Time", value: "2.3s", icon: Clock, color: "text-green-500" },
    { label: "Success Rate", value: "98.6%", icon: Zap, color: "text-yellow-500" },
  ]

  const logs = [
    { time: "10:45:32", type: "INFO", message: "Research initiated for Tokyo" },
    { time: "10:45:33", type: "STEP", message: "Fetching primary data sources" },
    { time: "10:45:34", type: "STEP", message: "Analyzing completeness" },
    { time: "10:45:35", type: "ENRICHED", message: "Primary research complete" },
    { time: "10:45:37", type: "STEP", message: "Gap-filling in progress" },
    { time: "10:45:39", type: "ENRICHED", message: "All fields populated successfully" },
    { time: "10:42:18", type: "INFO", message: "Research initiated for London" },
    { time: "10:42:19", type: "STEP", message: "Model: Gemini Flash" },
    { time: "10:42:21", type: "ENRICHED", message: "Research complete" },
    { time: "10:38:05", type: "ERROR", message: "API rate limit reached" },
    { time: "10:37:42", type: "INFO", message: "Custom criteria added: Climate Data" },
  ]

  const modelUsage = [
    { model: "Gemini Flash", count: 89, percentage: 60 },
    { model: "Gemini Pro", count: 42, percentage: 29 },
    { model: "Google Search", count: 16, percentage: 11 },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Model Usage Summary</CardTitle>
          <CardDescription>Distribution of models used in research tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modelUsage.map((usage) => (
            <div key={usage.model} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{usage.model}</span>
                <span className="text-muted-foreground">
                  {usage.count} uses ({usage.percentage}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${usage.percentage}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logs Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Recent research activity and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-muted-foreground">{log.time}</span>
                <Badge
                  variant={log.type === "ERROR" ? "destructive" : log.type === "ENRICHED" ? "default" : "secondary"}
                  className="mt-0.5 shrink-0"
                >
                  {log.type}
                </Badge>
                <span className="text-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Bar chart placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Pie chart placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
