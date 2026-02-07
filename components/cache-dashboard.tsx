"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  RefreshCw, 
  Trash2, 
  Activity, 
  Database, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3
} from "lucide-react"

interface CacheStats {
  totalEntries: number
  totalHits: number
  totalMisses: number
  hitRate: string
  memoryUsageMB: string
}

interface CachePerformance {
  efficiency: string
  recommendation: string
}

interface CacheEntry {
  key: string
  expiresAt: number
  size?: number
}

interface InvalidateAction {
  action: string
  description: string
  params: Record<string, string>
}

export default function CacheDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [performance, setPerformance] = useState<CachePerformance | null>(null)
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/cache/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data.statistics)
        setPerformance(data.data.performance)
        setEntries(data.data.entries || [])
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchActions()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const clearCache = async (pattern?: string) => {
    if (!confirm(pattern ? `Clear caches matching "${pattern}"?` : 'Clear ALL caches?')) {
      return
    }

    try {
      setClearing(true)
      const response = await fetch('/api/cache/stats', {
        method: 'DELETE',
        headers: pattern ? { 'Content-Type': 'application/json' } : {},
        body: pattern ? JSON.stringify({ pattern }) : undefined,
      })

      if (response.ok) {
        await fetchStats()
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    } finally {
      setClearing(false)
    }
  }

  const executeInvalidation = async (action: string, params?: Record<string, any>) => {
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      })

      if (response.ok) {
        await fetchStats()
      }
    } catch (error) {
      console.error('Failed to execute invalidation:', error)
    }
  }

  const getCategoryStats = () => {
    if (!entries.length) return []

    const categories = {
      research: entries.filter(e => e.key.startsWith('research:')),
      jobs: entries.filter(e => e.key.startsWith('agent:job')),
      history: entries.filter(e => e.key.startsWith('history:')),
      planner: entries.filter(e => e.key.startsWith('planner:')),
      other: entries.filter(e => 
        !e.key.startsWith('research:') && 
        !e.key.startsWith('agent:job') && 
        !e.key.startsWith('history:') &&
        !e.key.startsWith('planner:')
      ),
    }

    return Object.entries(categories).map(([name, items]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: items.length,
      percentage: ((items.length / entries.length) * 100).toFixed(1),
    }))
  }

  const getStatusColor = (hitRate: number) => {
    if (hitRate >= 70) return "text-green-600"
    if (hitRate >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = (hitRate: number) => {
    if (hitRate >= 70) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (hitRate >= 40) return <Activity className="h-5 w-5 text-yellow-600" />
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading cache statistics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hitRate = stats ? parseFloat(stats.hitRate) : 0
  const categoryStats = getCategoryStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cache Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage application cache</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => clearCache()}
            disabled={clearing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            {stats && getStatusIcon(hitRate)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats ? getStatusColor(hitRate) : ''}`}>
              {stats?.hitRate || '0%'}
            </div>
            <Progress value={hitRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.totalHits || 0} hits / {stats?.totalMisses || 0} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Cached items in memory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.memoryUsageMB || '0 MB'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Current memory footprint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.efficiency || '0'}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {performance?.recommendation || 'Analyzing...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="entries">Cache Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache by Category</CardTitle>
              <CardDescription>Distribution of cached items across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryStats.length > 0 ? (
                <div className="space-y-4">
                  {categoryStats.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{category.count}</Badge>
                          <span className="text-sm text-muted-foreground">{category.percentage}%</span>
                        </div>
                      </div>
                      <Progress value={parseFloat(category.percentage)} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No cache entries available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common cache invalidation operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => executeInvalidation('invalidate_old', { maxAgeMs: 3600000 })}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Clean entries older than 1 hour
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => clearCache('research:*')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear research caches
                </Button>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => clearCache('agent:job*')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear job caches
                </Button>

                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => clearCache('history:*')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear history caches
                </Button>

                <Separator />

                <Button
                  variant="destructive"
                  className="justify-start"
                  onClick={() => executeInvalidation('clear_all')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Nuclear: Clear ALL caches
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Entries</CardTitle>
              <CardDescription>Active cache entries and their expiration times</CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {entries.slice(0, 50).map((entry, idx) => {
                    const timeLeft = Math.max(0, entry.expiresAt - Date.now())
                    const minutes = Math.floor(timeLeft / 60000)
                    const seconds = Math.floor((timeLeft % 60000) / 1000)
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono truncate">{entry.key}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {minutes}m {seconds}s
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {entries.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing first 50 of {entries.length} entries
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No cache entries available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
