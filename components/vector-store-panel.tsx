"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Sparkles, Database, Layers, Loader2 } from "lucide-react"

export function VectorStorePanel() {
  const [mixedbreadKey, setMixedbreadKey] = useState("")
  const [pineconeKey, setPineconeKey] = useState("")
  const [pineconeIndex, setPineconeIndex] = useState("")
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmbed = async () => {
    if (!mixedbreadKey || !pineconeKey || !pineconeIndex || !text) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/vector-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mixedbreadKey,
          pineconeKey,
          pineconeIndex,
          text,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start embedding process")
      }

      toast.success("Embedding process started! Check the console for progress.")
      setText("") // Clear text input after success
    } catch (error) {
      toast.error("An error occurred while starting the process")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Configuration
            </CardTitle>
            <CardDescription>
              Enter your API keys for Mixedbread (embeddings) and Pinecone (vector store).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mixedbread-key">Mixedbread API Key</Label>
              <Input
                id="mixedbread-key"
                type="password"
                placeholder="mb_..."
                value={mixedbreadKey}
                onChange={(e) => setMixedbreadKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinecone-key">Pinecone API Key</Label>
              <Input
                id="pinecone-key"
                type="password"
                placeholder="pc_..."
                value={pineconeKey}
                onChange={(e) => setPineconeKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinecone-index">Pinecone Index Name</Label>
              <Input
                id="pinecone-index"
                placeholder="my-research-index"
                value={pineconeIndex}
                onChange={(e) => setPineconeIndex(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Input Data
            </CardTitle>
            <CardDescription>
              Enter the text content you want to embed and store. Large text will be automatically chunked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 h-full">
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                placeholder="Paste your research notes, articles, or any text here..."
                className="min-h-[200px] resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/50 p-4 rounded-b-lg border-t">
            <p className="text-xs text-muted-foreground">
               Using {text.length} characters
            </p>
            <Button onClick={handleEmbed} disabled={isLoading || !text} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Embed & Store
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Understanding the vector embedding pipeline</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                    <h3 className="font-medium">Chunking</h3>
                    <p className="text-sm text-muted-foreground">Large text is split into smaller, manageable chunks to preserve context and improve retrieval accuracy.</p>
                </div>
                <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card/50">
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                    <h3 className="font-medium">Embedding</h3>
                    <p className="text-sm text-muted-foreground">Chunks are converted into vector representations using Mixedbread's high-performance embedding models.</p>
                </div>
                <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card/50">
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                    <h3 className="font-medium">Storage</h3>
                    <p className="text-sm text-muted-foreground">Vectors are stored in your Pinecone index, ready for semantic search and retrieval in your applications.</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
