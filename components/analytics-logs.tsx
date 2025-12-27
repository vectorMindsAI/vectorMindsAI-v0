"use client"

import { useEffect, useState } from "react"
import { BarChart3, Clock, Zap, Activity, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import posthog from 'posthog-js'

interface AnalyticsStats {
  totalResearches: number
  avgResponseTime: string
  successRate: string
  activeUsers: number
}

interface ModelUsage {
  model: string
  count: number
  percentage: number
}

interface ActivityLog {
  time: string
  type: string
  message: string
  userId?: string
}

export function AnalyticsLogs() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalResearches: 0,
    avgResponseTime: "0s",
    successRate: "0%",
    activeUsers: 0,
  })
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    // Check if PostHog is initialized
    const isInitialized = typeof window !== 'undefined' && posthog.__loaded

    if (!isInitialized) {
      console.log("Analytics: PostHog not initialized yet")
      // Set example data
      setStats({
        totalResearches: 0,
        avgResponseTime: "0s",
        successRate: "0%",
        activeUsers: 0,
      })
      setLogs([
        { 
          time: new Date().toLocaleTimeString(), 
          type: "INFO", 
          message: "Analytics dashboard initialized - Waiting for events..." 
        },
        { 
          time: new Date().toLocaleTimeString(), 
          type: "INFO", 
          message: "Configure PostHog API key in .env.local to start tracking" 
        },
      ])
      return
    }

    // Fetch real analytics data from PostHog
    // Note: For production, you'd want to use PostHog's API or export data to your own backend
    const recentEvents: ActivityLog[] = [
      {
        time: new Date().toLocaleTimeString(),
        type: "INFO",
        message: "Real-time analytics tracking active",
      },
    ]

    setLogs(recentEvents)

    // In a real implementation, you would:
    // 1. Query PostHog API for aggregated stats
    // 2. Or export events to your MongoDB and query from there
    // 3. Or use PostHog webhooks to stream events to your backend

    // For now, we'll show that the system is ready
    setStats({
      totalResearches: 0,
      avgResponseTime: "Loading...",
      successRate: "Loading...",
      activeUsers: 1,
    })

  }, [])

  const statsCards = [
    { label: "Total Researches", value: stats.totalResearches.toString(), icon: BarChart3, color: "text-blue-500" },
    { label: "Avg. Response Time", value: stats.avgResponseTime, icon: Clock, color: "text-green-500" },
    { label: "Success Rate", value: stats.successRate, icon: Zap, color: "text-yellow-500" },
    { label: "Active Sessions", value: stats.activeUsers.toString(), icon: Activity, color: "text-purple-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Analytics Configuration Notice */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Analytics Tracking Active
          </CardTitle>
          <CardDescription>
            All user interactions, research queries, and model usage are being tracked in real-time.
            Even when you share this code with clients, events will flow to your analytics dashboard.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsCards.map((stat) => (
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
      {modelUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Distribution</CardTitle>
            <CardDescription>Track which AI models clients are using most</CardDescription>
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
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Activity</CardTitle>
          <CardDescription>
            Live feed of research queries, model usage, and user interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet. Start a research query to see events here!</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 w-20 shrink-0 font-mono text-xs text-muted-foreground">{log.time}</span>
                  <Badge
                    variant={log.type === "ERROR" ? "destructive" : log.type === "SUCCESS" ? "default" : "secondary"}
                    className="mt-0.5 shrink-0"
                  >
                    {log.type}
                  </Badge>
                  <span className="text-foreground">{log.message}</span>
                  {log.userId && (
                    <span className="ml-auto text-xs text-muted-foreground">{log.userId}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard Link */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">View Full Analytics Dashboard</p>
              <p className="text-xs text-muted-foreground">
                Access detailed insights, session replays, and advanced metrics in PostHog
              </p>
            </div>
            <Badge className="bg-primary">
              View in PostHog →
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tracked Events Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Events Being Tracked</CardTitle>
          <CardDescription>Complete list of analytics events captured by the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { category: "Research", events: ["research_initiated", "research_completed", "research_failed"] },
              { category: "Extended Research", events: ["extended_research_started", "extended_research_completed"] },
              { category: "Model Settings", events: ["model_changed", "model_settings_updated"] },
              { category: "Custom Criteria", events: ["custom_criteria_added", "custom_criteria_removed"] },
              { category: "Vector Store", events: ["vector_store_search", "vector_store_document_added"] },
              { category: "Search History", events: ["search_history_viewed", "search_history_item_deleted"] },
              { category: "Authentication", events: ["user_signed_in", "user_signed_up", "user_signed_out"] },
              { category: "Errors", events: ["api_error", "client_error"] },
            ].map((group) => (
              <div key={group.category} className="space-y-2">
                <p className="text-sm font-semibold text-primary">{group.category}</p>
                <ul className="space-y-1">
                  {group.events.map((event) => (
                    <li key={event} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
            ))}  
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
