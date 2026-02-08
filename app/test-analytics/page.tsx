"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { analytics } from "@/lib/analytics"
import { Badge } from "@/components/ui/badge"

export default function AnalyticsTestPage() {
  const [testResult, setTestResult] = useState<string>("")
  const [isPostHogLoaded, setIsPostHogLoaded] = useState(false)

  const checkPostHog = () => {
    const loaded = !!(window as any).posthog?.__loaded
    setIsPostHogLoaded(loaded)
    
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const hasKey = !!apiKey
    
    const result = `
PostHog Loaded: ${loaded ? '✅ YES' : '❌ NO'}
API Key Present: ${hasKey ? '✅ YES' : '❌ NO'}
API Key Value: ${apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET'}
    `
    
    setTestResult(result)
    console.log('PostHog Check:', { loaded, hasKey, apiKey })
  }

  const sendTestEvent = () => {
    const testData = {
      query: 'TEST SEARCH - ' + new Date().toISOString(),
      model: 'test-model',
      duration: 1234,
      success: true,
      outputLength: 9999,
      outputCharacters: 9999,
      resultsCount: 5,
      testFlag: true,
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 Sending test event:', testData)
    
    analytics.track('research_completed', testData)
    
    setTestResult(`✅ Test event sent!\n\nData: ${JSON.stringify(testData, null, 2)}\n\nCheck:\n1. Browser Network tab (filter: capture)\n2. PostHog dashboard in 30 seconds\n3. Look for event with testFlag: true`)
  }

  const sendMultipleEvents = () => {
    // Send research_initiated
    const initiatedData = {
      query: 'Multi-test query',
      model: 'gemini-flash',
      criteriaCount: 3
    }
    console.log('📊 Test: research_initiated', initiatedData)
    analytics.track('research_initiated', initiatedData)
    
    // Send research_completed
    setTimeout(() => {
      const completedData = {
        query: 'Multi-test query',
        model: 'gemini-flash',
        duration: 2500,
        success: true,
        outputLength: 5678,
        outputCharacters: 5678,
        resultsCount: 7
      }
      console.log('📊 Test: research_completed', completedData)
      analytics.track('research_completed', completedData)
    }, 1000)
    
    // Send model_usage_tracked
    setTimeout(() => {
      const modelData = {
        model: 'gemini-flash',
        operation: 'test-research',
        outputLength: 5678,
        duration: 2500,
        tokensEstimate: 1420
      }
      console.log('📊 Test: model_usage_tracked', modelData)
      analytics.track('model_usage_tracked', modelData)
    }, 2000)
    
    setTestResult('✅ Sent 3 test events!\n\nCheck console and PostHog dashboard.')
  }

  const checkNetworkRequests = () => {
    setTestResult(`
🔍 How to check network requests:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by: "capture" or "posthog"
4. Click "Send Test Event" button
5. Look for POST request to:
   https://app.posthog.com/capture/
   
6. Click on the request
7. Go to "Payload" or "Request" tab
8. You should see your event data with properties

Expected payload structure:
{
  "api_key": "phc_...",
  "event": "research_completed",
  "properties": {
    "query": "...",
    "outputLength": 9999,
    "duration": 1234,
    ...
  }
}
    `)
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📊 Analytics Testing Dashboard</CardTitle>
          <CardDescription>
            Test if PostHog analytics are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={isPostHogLoaded ? "default" : "secondary"}>
              {isPostHogLoaded ? "✅ PostHog Active" : "⚠️ Not Checked"}
            </Badge>
          </div>
          
          <div className="grid gap-3">
            <Button onClick={checkPostHog} variant="outline">
              1. Check PostHog Status
            </Button>
            
            <Button onClick={sendTestEvent} variant="default">
              2. Send Test Event (research_completed)
            </Button>
            
            <Button onClick={sendMultipleEvents} variant="default">
              3. Send Multiple Test Events
            </Button>
            
            <Button onClick={checkNetworkRequests} variant="outline">
              4. How to Check Network Tab
            </Button>
          </div>

          {testResult && (
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {testResult}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔍 How to View Properties in PostHog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Method 1: Click on Event</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to PostHog → Activity → Events</li>
              <li>Find "research_completed" event</li>
              <li>Click on the event row</li>
              <li>Look for "Properties" section</li>
              <li>You should see: query, outputLength, duration, model, etc.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Method 2: Create Table View</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to PostHog → Insights → New Insight</li>
              <li>Select event: "research_completed"</li>
              <li>Change visualization to "Table"</li>
              <li>Click "+ Add column" or "Columns"</li>
              <li>Add: Properties → query</li>
              <li>Add: Properties → outputLength</li>
              <li>Add: Properties → duration</li>
              <li>Add: Properties → model</li>
              <li>Save as "User Searches"</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Method 3: Filter Test Events</h3>
            <p className="text-sm text-muted-foreground">
              In PostHog Events, add filter: <code className="bg-muted px-1 py-0.5 rounded">testFlag = true</code> to see only test events
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle>⚠️ Common Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Properties are empty in PostHog:</p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground">
              <li>Check browser Network tab - are properties in the payload?</li>
              <li>Look at browser Console - see the log messages?</li>
              <li>Try clicking on individual events in PostHog, not just the count</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">No events showing up at all:</p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground">
              <li>Check if .env.local file exists with NEXT_PUBLIC_POSTHOG_KEY</li>
              <li>Restart your dev server after creating .env.local</li>
              <li>Check for ad blockers (disable for localhost)</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">PostHog shows "undefined":</p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground">
              <li>Variables might be undefined when track() is called</li>
              <li>Check browser console logs to see actual values</li>
              <li>Make sure data exists before tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
