"use client"

import { useState } from "react"
import { Plus, Trash2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"

interface Criterion {
  id: string
  name: string
  description: string
}

export function CriteriaBuilder() {
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: "1", name: "Average Temperature", description: "Annual average temperature in Celsius" },
  ])

  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      name: "",
      description: "",
    }
    setCriteria([...criteria, newCriterion])
    toast.success("New criterion added")
  }

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id))
    toast.success("Criterion removed")
  }

  const updateCriterion = (id: string, field: "name" | "description", value: string) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const generateQuery = () => {
    if (criteria.length === 0) {
      toast.error("Please add at least one criterion")
      return
    }
    toast.success("Query generated successfully")
  }

  const addToPipeline = () => {
    if (criteria.some((c) => !c.name || !c.description)) {
      toast.error("Please fill in all fields")
      return
    }
    toast.success(`Added ${criteria.length} criteria to pipeline`)
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Custom Criteria Builder</CardTitle>
          <CardDescription className="text-xs lg:text-sm">
            Define custom fields to add to your enrichment pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
          <div className="space-y-3 lg:space-y-4">
            {criteria.map((criterion, index) => (
              <Card key={criterion.id}>
                <CardContent className="pt-4 lg:pt-6 space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs lg:text-sm font-medium text-muted-foreground">Field {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(criterion.id)}
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`name-${criterion.id}`} className="text-xs lg:text-sm">
                      Field Name
                    </Label>
                    <Input
                      id={`name-${criterion.id}`}
                      placeholder="e.g., GDP per capita"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(criterion.id, "name", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`desc-${criterion.id}`} className="text-xs lg:text-sm">
                      Description
                    </Label>
                    <Input
                      id={`desc-${criterion.id}`}
                      placeholder="What information should be collected?"
                      value={criterion.description}
                      onChange={(e) => updateCriterion(criterion.id, "description", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
            <Button variant="outline" onClick={addCriterion} className="flex-1 bg-transparent text-sm lg:text-base">
              <Plus className="mr-2 h-4 w-4" />
              <span className="truncate">Add Criterion</span>
            </Button>
            <Button onClick={generateQuery} className="flex-1 text-sm lg:text-base">
              <Wand2 className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Generate Query</span>
            </Button>
          </div>

          <Button onClick={addToPipeline} className="w-full text-sm lg:text-base" size="lg">
            Add to Agent Pipeline
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 lg:pt-6">
          <p className="text-xs lg:text-sm leading-relaxed text-foreground">
            <strong>How it works:</strong> Custom criteria are added to the enrichment pipeline and will be
            automatically searched and filled by the AI agent. Be specific in your descriptions for best results.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
