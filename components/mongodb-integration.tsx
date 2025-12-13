"use client"

import { useState } from "react"
import { Database, RefreshCw, CheckCircle2, FileJson, Plus } from "lucide-react"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export function MongodbIntegration() {
  const [mongoUrl, setMongoUrl] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [collections, setCollections] = useState<string[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [documentsMap, setDocumentsMap] = useState<Record<string, any[]>>({})
  const [mergedUniqueKeys, setMergedUniqueKeys] = useState<string[]>([])

  const handleConnect = async () => {
    if (!mongoUrl.trim()) {
      toast.error("Please enter a MongoDB URL")
      return
    }

    setIsLoading(true)
    toast.loading("Connecting to MongoDB...", { id: "mongo-connect" })

    try {
      const response = await fetch("/api/mongodb/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mongoUrl }),
      })

      const data = await response.json()

      if (data.status === "connected") {
        setIsConnected(true)
        setCollections(data.collections)
        toast.success("Connected to MongoDB successfully!", { id: "mongo-connect" })
      } else {
        throw new Error("Connection failed")
      }
    } catch (error) {
      toast.error("Failed to connect to MongoDB", { id: "mongo-connect" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCollection = (collection: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collection) ? prev.filter((c) => c !== collection) : [...prev, collection],
    )
  }

  const handleFetchDocuments = async () => {
    if (selectedCollections.length === 0) {
      toast.error("Please select at least one collection")
      return
    }

    setIsLoading(true)
    toast.loading(`Fetching documents from ${selectedCollections.length} collection(s)...`, { id: "fetch-docs" })

    try {
      const response = await fetch("/api/mongodb/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collections: selectedCollections }),
      })

      const data = await response.json()

      // Group documents by collection
      const grouped: Record<string, any[]> = {}
      data.documents.forEach((doc: any) => {
        if (!grouped[doc.collection]) {
          grouped[doc.collection] = []
        }
        grouped[doc.collection].push(doc)
      })

      setDocumentsMap(grouped)
      setMergedUniqueKeys(data.fields)

      toast.success(`Fetched ${data.count} documents with ${data.fields.length} unique fields`, { id: "fetch-docs" })
    } catch (error) {
      toast.error("Failed to fetch documents", { id: "fetch-docs" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToSearchCriteria = () => {
    if (mergedUniqueKeys.length === 0) {
      toast.error("No fields available to add")
      return
    }

    console.log("[v0] Adding fields to search criteria:", mergedUniqueKeys)
    toast.success(`Added ${mergedUniqueKeys.length} fields to search criteria`)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Connection Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base lg:text-xl text-card-foreground">MongoDB Connection</CardTitle>
              <CardDescription className="text-xs lg:text-sm text-muted-foreground">
                Connect to your MongoDB database to fetch and analyze documents
              </CardDescription>
            </div>
            {isConnected && (
              <Badge
                variant="default"
                className="gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 shrink-0 w-fit"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mongo-url" className="text-xs lg:text-sm font-medium text-card-foreground">
              MongoDB Connection URL
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="mongo-url"
                type="password"
                placeholder="mongodb+srv://..."
                value={mongoUrl}
                onChange={(e) => setMongoUrl(e.target.value)}
                disabled={isConnected}
                className="flex-1 bg-background text-foreground text-sm"
              />
              <Button
                onClick={handleConnect}
                disabled={!mongoUrl || isConnected || isLoading}
                className="gap-2 w-full sm:w-auto text-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Connecting</span>
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>

          {isConnected && (
            <div className="space-y-3">
              <Label className="text-xs lg:text-sm font-medium text-card-foreground">
                Select Collections (Multiple)
              </Label>
              <div className="rounded-lg border border-border bg-background p-3 lg:p-4">
                <div className="space-y-2.5 lg:space-y-3">
                  {collections.map((col) => (
                    <div key={col} className="flex items-center gap-2 lg:gap-3">
                      <Checkbox
                        id={col}
                        checked={selectedCollections.includes(col)}
                        onCheckedChange={() => handleToggleCollection(col)}
                      />
                      <Label
                        htmlFor={col}
                        className="flex-1 cursor-pointer text-xs lg:text-sm font-normal text-foreground"
                      >
                        {col}
                      </Label>
                      {selectedCollections.includes(col) && (
                        <Badge variant="secondary" className="text-[10px] lg:text-xs shrink-0">
                          Selected
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleFetchDocuments}
                disabled={selectedCollections.length === 0 || isLoading}
                variant="secondary"
                className="w-full gap-2 text-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="truncate">Loading Documents</span>
                  </>
                ) : (
                  <>
                    <FileJson className="h-4 w-4 shrink-0" />
                    <span className="truncate">Fetch from {selectedCollections.length} Collection(s)</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mergedUniqueKeys.length > 0 && (
        <Card className="border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base lg:text-xl text-card-foreground">Merged Unique Fields</CardTitle>
            <CardDescription className="text-xs lg:text-sm text-muted-foreground">
              All unique field names detected across {Object.keys(documentsMap).length} collection(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs lg:text-sm font-medium text-card-foreground">
                  Total Fields: {mergedUniqueKeys.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {mergedUniqueKeys.map((field) => (
                  <Badge key={field} variant="secondary" className="bg-primary/10 text-primary text-[10px] lg:text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleAddToSearchCriteria} className="w-full gap-2 text-sm lg:text-base">
              <Plus className="h-4 w-4" />
              Add to Search Criteria
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.keys(documentsMap).length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base lg:text-xl text-card-foreground">Documents by Collection</CardTitle>
            <CardDescription className="text-xs lg:text-sm text-muted-foreground">
              Sample documents fetched from selected collections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6">
            {Object.entries(documentsMap).map(([collection, docs]) => (
              <div key={collection} className="space-y-2 lg:space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Database className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary shrink-0" />
                  <h4 className="text-xs lg:text-sm font-semibold text-card-foreground break-all">{collection}</h4>
                  <Badge variant="outline" className="text-[10px] lg:text-xs shrink-0">
                    {docs.length} docs
                  </Badge>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2 lg:p-4">
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc._id}
                        className="rounded-md border border-border bg-background p-2 lg:p-3 text-sm font-mono text-foreground"
                      >
                        <pre className="overflow-x-auto text-[10px] lg:text-xs whitespace-pre-wrap break-all">
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!isConnected && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 lg:pt-6">
            <div className="flex gap-2 lg:gap-3">
              <div className="flex h-7 w-7 lg:h-8 lg:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs lg:text-sm font-medium text-foreground">How to connect MongoDB</h4>
                <p className="text-xs lg:text-sm leading-relaxed text-muted-foreground">
                  Enter your MongoDB connection string to fetch documents. Select multiple collections to merge their
                  unique field names. The system will display all unique fields across collections, which you can then
                  add to your search criteria for targeted enrichment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
