"use client"

import { useState, useEffect } from "react"
import { History, Search, Download, Trash2, Eye, Calendar, Clock, Database, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/toast"
import { formatDistanceToNow } from "date-fns"

interface HistoryItem {
  _id: string
  query: string
  criteria: Array<{ id: string; name: string; description: string }>
  model: string
  fallbackModel?: string
  status: "success" | "error"
  sizeKB: number
  timestamp: string
}

interface HistoryDetailProps {
  item: HistoryItem
  onClose: () => void
  onDelete: (id: string) => void
}

function HistoryDetail({ item, onClose, onDelete }: HistoryDetailProps) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/history/${item._id}`)
        if (!res.ok) throw new Error("Failed to fetch results")
        const data = await res.json()
        setResults(data.results)
      } catch (error) {
        toast.error("Failed to load results")
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [item._id])

  const downloadJSON = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${item.query.replace(/\s+/g, "-")}-${new Date(item.timestamp).toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Downloaded!")
  }

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderJSON = (obj: any, level = 0): any => {
    if (obj === null || obj === undefined) return <span className="text-muted-foreground">null</span>

    if (typeof obj !== "object") {
      return <span className="text-green-500">{JSON.stringify(obj)}</span>
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span className="text-muted-foreground">[]</span>
      return (
        <div className="ml-4">
          {obj.map((item, idx) => (
            <div key={idx} className="border-l border-border pl-3 my-1">
              <span className="text-blue-500">[{idx}]</span> {renderJSON(item, level + 1)}
            </div>
          ))}
        </div>
      )
    }

    const keys = Object.keys(obj)
    if (keys.length === 0) return <span className="text-muted-foreground">{"{}"}</span>

    return (
      <div className="ml-4">
        {keys.map((key) => (
          <div key={key} className="my-1">
            <button
              onClick={() => toggleSection(`${level}-${key}`)}
              className="flex items-center gap-1 text-purple-500 hover:text-purple-400"
            >
              {typeof obj[key] === "object" && obj[key] !== null ? (
                expanded[`${level}-${key}`] ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )
              ) : null}
              <span className="font-mono">{key}:</span>
            </button>
            {expanded[`${level}-${key}`] !== false && (
              <div className="border-l border-border pl-3">{renderJSON(obj[key], level + 1)}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{item.query}</CardTitle>
              <CardDescription className="mt-1">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadJSON} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this search history?")) {
                    onDelete(item._id)
                    onClose()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading results...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span> {item.model}
                  </div>
                  {item.fallbackModel && (
                    <div>
                      <span className="text-muted-foreground">Fallback:</span> {item.fallbackModel}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Size:</span> {item.sizeKB.toFixed(2)} KB
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant={item.status === "success" ? "default" : "destructive"}>{item.status}</Badge>
                  </div>
                </div>
              </div>

              {item.criteria.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Criteria Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.criteria.map((c) => (
                      <Badge key={c.id} variant="outline">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-2">Results</h3>
                <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  {renderJSON(results)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function SearchHistoryPanel() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      })

      const res = await fetch(`/api/history?${params}`)
      if (!res.ok) throw new Error("Failed to fetch history")

      const data = await res.json()
      setHistory(data.history)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      toast.error("Failed to load search history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [page, searchTerm])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")

      toast.success("Deleted successfully")
      setHistory((prev) => prev.filter((item) => item._id !== id))
    } catch (error) {
      toast.error("Failed to delete history")
    }
  }

  const groupByDate = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Older: [],
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    items.forEach((item) => {
      const itemDate = new Date(item.timestamp)
      if (itemDate >= today) groups.Today.push(item)
      else if (itemDate >= yesterday) groups.Yesterday.push(item)
      else if (itemDate >= weekAgo) groups["This Week"].push(item)
      else if (itemDate >= monthAgo) groups["This Month"].push(item)
      else groups.Older.push(item)
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }

  const groupedHistory = groupByDate(history)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Search History
              </CardTitle>
              <CardDescription>View and manage your past research queries</CardDescription>
            </div>
            <Badge variant="secondary">{history.length} results</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No search history yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your completed research queries will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedHistory.map(([group, items]) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group}</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Card
                        key={item._id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{item.query}</h4>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Database className="h-3 w-3" />
                                  {item.sizeKB.toFixed(2)} KB
                                </span>
                              </div>
                              {item.criteria.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.criteria.slice(0, 3).map((c) => (
                                    <Badge key={c.id} variant="outline" className="text-xs">
                                      {c.name}
                                    </Badge>
                                  ))}
                                  {item.criteria.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{item.criteria.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedItem(item)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm("Delete this search history?")) {
                                    handleDelete(item._id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedItem && (
        <HistoryDetail item={selectedItem} onClose={() => setSelectedItem(null)} onDelete={handleDelete} />
      )}
    </>
  )
}
