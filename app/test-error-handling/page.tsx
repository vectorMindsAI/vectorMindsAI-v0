'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'
import { logger } from '@/lib/logger'
import { AlertCircle, Bug, RefreshCw } from 'lucide-react'

function ErrorTrigger({ level }: { level: string }) {
    const [shouldError, setShouldError] = useState(false)

    if (shouldError) {
        throw new Error(`Test ${level} error thrown!`)
    }

    return (
        <div className="space-y-2">
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setShouldError(true)}
                className="w-full"
            >
                <Bug className="mr-2 h-4 w-4" />
                Trigger {level} Error
            </Button>
        </div>
    )
}

function AsyncErrorTest() {
    const [loading, setLoading] = useState(false)

    const triggerAsyncError = async () => {
        setLoading(true)
        try {
            await new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Async operation failed')), 1000)
            )
        } catch (error) {
            logger.error('Async error test', error, {
                component: 'AsyncErrorTest',
                operation: 'simulatedAsync',
            })
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={triggerAsyncError}
            disabled={loading}
            className="w-full"
        >
            {loading ? 'Processing...' : 'Trigger Async Error (with logging)'}
        </Button>
    )
}

function LoggingTest() {
    return (
        <div className="space-y-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => logger.debug('Debug message', { test: true })}
                className="w-full"
            >
                Log Debug
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => logger.info('Info message', { test: true })}
                className="w-full"
            >
                Log Info
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => logger.warn('Warning message', { test: true })}
                className="w-full"
            >
                Log Warning
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => logger.error('Error message', new Error('Test error'), { test: true })}
                className="w-full"
            >
                Log Error
            </Button>
        </div>
    )
}

function ApiTrackingTest() {
    const [result, setResult] = useState<string>('')

    const testApiTracking = async () => {
        try {
            const data = await logger.trackApiCall(
                '/api/test',
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    return { success: true, data: 'test data' }
                },
                { testParam: 'value' }
            )
            setResult(`Success: ${JSON.stringify(data)}`)
        } catch (error) {
            setResult(`Error: ${error}`)
        }
    }

    return (
        <div className="space-y-2">
            <Button
                variant="outline"
                size="sm"
                onClick={testApiTracking}
                className="w-full"
            >
                Test API Tracking
            </Button>
            {result && (
                <p className="text-xs text-muted-foreground font-mono p-2 bg-muted rounded">
                    {result}
                </p>
            )}
        </div>
    )
}

export default function ErrorHandlingTest() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Error Handling & Logging Test Suite
                    </CardTitle>
                    <CardDescription>
                        Test error boundaries and logging functionality. Check the browser console for log output.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Component-Level Error</CardTitle>
                        <CardDescription className="text-xs">
                            Tests component-level error boundary
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ErrorBoundary level="component">
                            <ErrorTrigger level="component" />
                        </ErrorBoundary>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Section-Level Error</CardTitle>
                        <CardDescription className="text-xs">
                            Tests section-level error boundary
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ErrorBoundary level="section">
                            <ErrorTrigger level="section" />
                        </ErrorBoundary>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Async Error Handling</CardTitle>
                        <CardDescription className="text-xs">
                            Tests async error with logging
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AsyncErrorTest />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Logger Test</CardTitle>
                        <CardDescription className="text-xs">
                            Tests different log levels
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoggingTest />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">API Tracking Test</CardTitle>
                        <CardDescription className="text-xs">
                            Tests API call duration tracking
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ApiTrackingTest />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Action Tracking Test</CardTitle>
                        <CardDescription className="text-xs">
                            Tests user action tracking
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logger.trackAction('test_button_clicked', {
                                buttonName: 'test',
                                page: 'error-test',
                            })}
                            className="w-full"
                        >
                            Track User Action
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-sm">Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>1. Component/Section Error Tests:</strong> Click to trigger errors. The error boundary will catch and display a fallback UI.</p>
                    <p><strong>2. Async Error Test:</strong> Triggers an async error that is logged but doesn't crash the component.</p>
                    <p><strong>3. Logger Tests:</strong> Each button logs different severity levels. Check browser console.</p>
                    <p><strong>4. API Tracking:</strong> Simulates an API call and tracks its duration.</p>
                    <p><strong>5. Action Tracking:</strong> Tracks user actions to analytics.</p>
                    <p className="mt-4 p-3 bg-muted rounded-lg">
                        <strong>Note:</strong> Open your browser's Developer Console (F12) to see log output.
                        Errors are also sent to analytics and the error logging API.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
