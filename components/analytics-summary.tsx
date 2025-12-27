"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Search, Zap, FileText, TrendingUp } from "lucide-react"

interface AnalyticsSummary {
  searchesInitiated: number
  searchesCompleted: number
  searchesFailed: number
  totalOutputLength: number
  averageOutputLength: number
  modelUsage: Record<string, number>
  topModel: string
  averageDuration: number
}

export function AnalyticsSummary() {
  const [summary, setSummary] = useState<AnalyticsSummary>({
    searchesInitiated: 0,
    searchesCompleted: 0,
    searchesFailed: 0,
    totalOutputLength: 0,
    averageOutputLength: 0,
    modelUsage: {},
    topModel: 'N/A',
    averageDuration: 0,
  })

  useEffect(() => {
    // This would normally fetch from your analytics backend
    // For now, we'll show the structure
    const mockSummary: AnalyticsSummary = {
      searchesInitiated: 0,
      searchesCompleted: 0,
      searchesFailed: 0,
      totalOutputLength: 0,
      averageOutputLength: 0,
      modelUsage: {},
      topModel: 'N/A',
      averageDuration: 0,
    }
    setSummary(mockSummary)
  }, [])

  const successRate = summary.searchesInitiated > 0 
    ? ((summary.searchesCompleted / summary.searchesInitiated) * 100).toFixed(1)
    : '0'

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Searches Initiated */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Searches Initiated</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.searchesInitiated}</div>
            <p className="text-xs text-muted-foreground">
              Total research requests
            </p>
          </CardContent>
        </Card>

        {/* Searches Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Searches Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.searchesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Success rate: {successRate}%
            </p>
          </CardContent>
        </Card>

        {/* Average Duration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(summary.averageDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Per research task
            </p>
          </CardContent>
        </Card>

        {/* Total Output */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Output</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(summary.totalOutputLength)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatBytes(summary.averageOutputLength)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Usage Statistics</CardTitle>
          <CardDescription>Track which models are used and their output metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(summary.modelUsage).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(summary.modelUsage).map(([model, count]) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{model}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{count} uses</span>
                    <Badge variant={model === summary.topModel ? "default" : "secondary"}>
                      {((count / summary.searchesCompleted) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              No model usage data yet. Start a research task to see statistics.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Tracking Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What's Being Tracked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium">Search Operations</p>
                <p className="text-xs text-muted-foreground">Initiated, completed, failed with durations and results</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium">Model Usage</p>
                <p className="text-xs text-muted-foreground">Which models used, output length, estimated tokens</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium">Criteria Management</p>
                <p className="text-xs text-muted-foreground">Custom criteria additions and removals</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">✓</Badge>
              <div>
                <p className="font-medium">Performance Metrics</p>
                <p className="text-xs text-muted-foreground">Response times, success rates, output sizes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
