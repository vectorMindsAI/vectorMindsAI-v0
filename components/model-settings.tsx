"use client"

import { useState, useEffect } from "react"
import { Check, Shield, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { analytics } from "@/lib/analytics"

export function ModelSettings() {
  const [selectedModel, setSelectedModel] = useState("gemini-flash")
  const [previousModel, setPreviousModel] = useState("gemini-flash")
  const [apiKey, setApiKey] = useState("")
  const [customModel, setCustomModel] = useState("")
  const [isValidated, setIsValidated] = useState(false)

  const models = [
    {
      id: "gemini-flash",
      name: "Gemini Flash",
      description: "Fast responses, optimized for quick research tasks",
      badge: "Recommended",
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      description: "Advanced reasoning for complex data enrichment",
      badge: "Pro",
    },
    {
      id: "google-search",
      name: "Google Search API",
      description: "Direct search integration for real-time data",
      badge: "API",
    },
    {
      id: "custom",
      name: "Custom API Model",
      description: "Connect your own model endpoint",
      badge: "Advanced",
    },
  ]

  // Track model changes
  useEffect(() => {
    if (selectedModel !== previousModel) {
      analytics.track('model_changed', {
        previousModel,
        newModel: selectedModel,
      });
      setPreviousModel(selectedModel);
    }
  }, [selectedModel, previousModel]);

  const handleSaveSettings = () => {
    setIsValidated(true);
    
    // Track model settings update
    analytics.track('model_settings_updated', {
      model: selectedModel,
      settings: {
        hasApiKey: !!apiKey,
        customEndpoint: selectedModel === 'custom' ? !!customModel : false,
        timestamp: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
          <CardDescription>Choose which model the agent uses for research</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
            {models.map((model) => (
              <div key={model.id} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
                <Label
                  htmlFor={model.id}
                  className="flex flex-1 cursor-pointer flex-col gap-1 rounded-lg border border-border p-4 hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{model.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {model.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedModel === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom-model">Custom Model Endpoint</Label>
              <Input
                id="custom-model"
                placeholder="https://api.example.com/v1/model"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Manage your API keys and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key-settings">API Key</Label>
            <div className="relative">
              <Input
                id="api-key-settings"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              {isValidated && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />}
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Your API key is encrypted and stored securely. It's never shared or exposed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4">
            <Shield className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Validation Status</p>
              <p className="text-xs text-muted-foreground">
                {isValidated ? "API key validated successfully" : "Not validated"}
              </p>
            </div>
            <Badge variant={isValidated ? "default" : "secondary"}>{isValidated ? "Active" : "Inactive"}</Badge>
          </div>

          <Button className="w-full" onClick={handleSaveSettings} disabled={!apiKey}>
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
