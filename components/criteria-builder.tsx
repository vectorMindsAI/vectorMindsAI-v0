"use client"

import { useState } from "react"
import { Plus, Trash2, Wand2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"
import { analytics } from "@/lib/analytics"
import { TemplateSelector } from "./template-selector"

interface OutputSchemaItem {
  key: string
  description: string
}

interface Criterion {
  id: string
  name: string
  description: string
  outputSchema: OutputSchemaItem[]
}

interface CriteriaBuilderProps {
  criteria: Criterion[]
  setCriteria: (criteria: Criterion[]) => void
}

export function CriteriaBuilder({ criteria, setCriteria }: CriteriaBuilderProps) {

  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      name: "",
      description: "",
      outputSchema: [],
    }
    setCriteria([...criteria, newCriterion])
    toast.success("New criterion added")
    
    // Track criteria addition
    analytics.track('custom_criteria_added', {
      criteriaName: 'New Criterion',
      criteriaType: 'custom',
    });
  }

  const removeCriterion = (id: string) => {
    const criterionToRemove = criteria.find(c => c.id === id);
    setCriteria(criteria.filter((c) => c.id !== id))
    toast.success("Criterion removed")
    
    // Track criteria removal
    if (criterionToRemove) {
      analytics.track('custom_criteria_removed', {
        criteriaName: criterionToRemove.name || 'Unnamed Criterion',
      });
    }
  }

  const updateCriterion = (id: string, field: "name" | "description", value: string) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const addSchemaItem = (criterionId: string) => {
    setCriteria(criteria.map(c => {
      if (c.id === criterionId) {
        return {
          ...c,
          outputSchema: [...c.outputSchema, { key: "", description: "" }]
        }
      }
      return c
    }))
  }

  const updateSchemaItem = (criterionId: string, index: number, field: "key" | "description", value: string) => {
    setCriteria(criteria.map(c => {
      if (c.id === criterionId) {
        const newSchema = [...c.outputSchema]
        newSchema[index] = { ...newSchema[index], [field]: value }
        return { ...c, outputSchema: newSchema }
      }
      return c
    }))
  }

  const removeSchemaItem = (criterionId: string, index: number) => {
    setCriteria(criteria.map(c => {
      if (c.id === criterionId) {
        return {
          ...c,
          outputSchema: c.outputSchema.filter((_, i) => i !== index)
        }
      }
      return c
    }))
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
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base lg:text-lg">Custom Criteria Builder</CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Define custom fields to add to your enrichment pipeline
              </CardDescription>
            </div>
            <TemplateSelector onSelect={(template) => {
              const newCriteria = template.criteria.map(c => ({
                ...c,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
              }));
              setCriteria([...criteria, ...newCriteria]);
              toast.success(`Loaded "${template.name}" template`);
              analytics.track('research_template_loaded', {
                templateName: template.name,
                criteriaCount: newCriteria.length
              });
            }} />
          </div>
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
                  
                  {/* Schema Builder Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs lg:text-sm">Output Schema (Key : Value)</Label>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addSchemaItem(criterion.id)}
                            className="h-6 text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add Field
                        </Button>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-muted">
                        {criterion.outputSchema.map((item, sIndex) => (
                            <div key={sIndex} className="flex items-end gap-2">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">Key</Label>
                                    <Input 
                                        placeholder="key_name" 
                                        value={item.key}
                                        onChange={(e) => updateSchemaItem(criterion.id, sIndex, "key", e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="flex-[2] space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">Description/Value Format</Label>
                                    <Input 
                                        placeholder="e.g. Number in millions" 
                                        value={item.description}
                                        onChange={(e) => updateSchemaItem(criterion.id, sIndex, "description", e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSchemaItem(criterion.id, sIndex)}
                                    className="h-8 w-8 text-destructive/50 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                         {criterion.outputSchema.length === 0 && (
                            <p className="text-[10px] text-muted-foreground italic">No structured fields valid. Output will be free-text.</p>
                        )}
                    </div>
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
            <strong>How it works:</strong> Define strictly structured keys to force the AI to return data in a specific JSON-like format for each criterion.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
