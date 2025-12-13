"use client"

import { useState } from "react"
import { Upload, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function ResourceInjector() {
  const [fieldName, setFieldName] = useState("")
  const [resourceLink, setResourceLink] = useState("")
  const [textSnippet, setTextSnippet] = useState("")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>External Resource Injector</CardTitle>
              <CardDescription>Provide specific resources to fill missing fields</CardDescription>
            </div>
            <Badge variant="secondary">Advanced</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Field Name */}
          <div className="space-y-2">
            <Label htmlFor="field-name">Missing Field Name</Label>
            <Input
              id="field-name"
              placeholder="e.g., GDP, Climate Data, Top Industries"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">The field that needs to be populated with external data</p>
          </div>

          {/* Resource Link */}
          <div className="space-y-2">
            <Label htmlFor="resource-link">Resource URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="resource-link"
                  placeholder="https://example.com/data"
                  value={resourceLink}
                  onChange={(e) => setResourceLink(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Provide a URL to a page or document with the data</p>
          </div>

          {/* Text Snippet */}
          <div className="space-y-2">
            <Label htmlFor="text-snippet">Or Paste Text Snippet</Label>
            <Textarea
              id="text-snippet"
              placeholder="Paste relevant text content here..."
              value={textSnippet}
              onChange={(e) => setTextSnippet(e.target.value)}
              rows={6}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Alternative to URL: paste the content directly</p>
          </div>

          {/* Action Button */}
          <Button className="w-full" size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Inject Resource Into Agent
          </Button>
        </CardContent>
      </Card>

      {/* Updated JSON Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Updated JSON Preview</CardTitle>
          <CardDescription>Preview how the data will be injected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 font-mono text-xs">
            <pre className="text-foreground">
              {`{
  "city": "San Francisco",
  "country": "United States",
  "population": 873965,
  ${fieldName ? `"${fieldName.toLowerCase().replace(/\\s+/g, "_")}": "Data from resource",` : ""}
  "status": "pending_injection"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold">How Resource Injection Works</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you have a specific URL or document containing data for a missing field, the agent will:
            </p>
            <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Fetch content from the provided URL or use your text snippet</li>
              <li>Extract relevant information for the specified field</li>
              <li>Validate and format the data</li>
              <li>Update the research JSON with the new information</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
