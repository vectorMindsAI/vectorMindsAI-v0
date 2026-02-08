'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
    showDetails?: boolean
    level?: 'app' | 'page' | 'section' | 'component'
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
    showStackTrace: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showStackTrace: false,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo)
        }

        this.logError(error, errorInfo)

        this.setState({
            errorInfo,
        })

        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }
    }

    logError(error: Error, errorInfo: ErrorInfo) {
        const { level = 'component' } = this.props

        const errorData = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            level,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        }

        // Send to Sentry
        if (typeof window !== 'undefined') {
            Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
                tags: {
                    errorBoundary: level,
                },
                level: level === 'app' || level === 'page' ? 'error' : 'warning',
            })
        }

        // Send to analytics
        if (typeof window !== 'undefined' && (window as any).analytics) {
            try {
                (window as any).analytics.track('client_error', {
                    component: level,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    componentStack: errorInfo.componentStack,
                })
            } catch (e) {
                console.error('Failed to track error in analytics:', e)
            }
        }

        // Send to API endpoint
        if (typeof window !== 'undefined') {
            fetch('/api/errors/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorData),
            }).catch((err) => {
                console.error('Failed to log error to server:', err)
            })
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showStackTrace: false,
        })
    }

    toggleStackTrace = () => {
        this.setState((prev) => ({
            showStackTrace: !prev.showStackTrace,
        }))
    }

    render() {
        const { hasError, error } = this.state
        const { children, fallback, showDetails = process.env.NODE_ENV === 'development', level = 'component' } = this.props

        if (hasError && error) {
            if (fallback) {
                return fallback
            }

            switch (level) {
                case 'app':
                    return this.renderAppLevelError()
                case 'page':
                    return this.renderPageLevelError()
                case 'section':
                    return this.renderSectionLevelError()
                case 'component':
                default:
                    return this.renderComponentLevelError()
            }
        }

        return children
    }

    renderAppLevelError() {
        const { error, errorInfo, showStackTrace } = this.state
        const { showDetails } = this.props

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl border-destructive">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-destructive/10 p-3">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-2xl">Application Error</CardTitle>
                                <CardDescription className="mt-2">
                                    Something went wrong. The application encountered an unexpected error.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {showDetails && error && (
                            <div className="space-y-2">
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm font-medium text-foreground mb-2">Error Message:</p>
                                    <p className="text-sm text-muted-foreground font-mono">{error.message}</p>
                                </div>

                                {errorInfo && (
                                    <div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={this.toggleStackTrace}
                                            className="mb-2"
                                        >
                                            {showStackTrace ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                                            {showStackTrace ? 'Hide' : 'Show'} Stack Trace
                                        </Button>

                                        {showStackTrace && (
                                            <div className="rounded-lg bg-muted p-4 max-h-64 overflow-auto">
                                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                                    {errorInfo.componentStack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex gap-2">
                        <Button onClick={this.handleReset} className="flex-1">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Link href="/" className="flex-1">
                            <Button variant="outline" className="w-full">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    renderPageLevelError() {
        const { error, errorInfo, showStackTrace } = this.state
        const { showDetails } = this.props

        return (
            <div className="container mx-auto py-8 px-4">
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-destructive mt-1" />
                            <div>
                                <CardTitle>Page Error</CardTitle>
                                <CardDescription className="mt-1">
                                    This page encountered an error and couldn't be displayed.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {showDetails && error && (
                        <CardContent className="space-y-3">
                            <div className="rounded-lg bg-muted p-3">
                                <p className="text-sm font-medium mb-1">Error:</p>
                                <p className="text-sm text-muted-foreground font-mono">{error.message}</p>
                            </div>

                            {errorInfo && (
                                <div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={this.toggleStackTrace}
                                    >
                                        {showStackTrace ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                                        Stack Trace
                                    </Button>

                                    {showStackTrace && (
                                        <div className="rounded-lg bg-muted p-3 max-h-48 overflow-auto mt-2">
                                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    )}

                    <CardFooter className="gap-2">
                        <Button onClick={this.handleReset} size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    renderSectionLevelError() {
        const { error } = this.state
        const { showDetails } = this.props

        return (
            <Card className="border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-base">Section Error</CardTitle>
                    </div>
                    {showDetails && error && (
                        <CardDescription className="mt-2 font-mono text-xs">
                            {error.message}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardFooter>
                    <Button onClick={this.handleReset} size="sm" variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reload Section
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    renderComponentLevelError() {
        const { error } = this.state
        const { showDetails } = this.props

        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-foreground">Component Error</p>
                        {showDetails && error && (
                            <p className="text-xs text-muted-foreground font-mono">{error.message}</p>
                        )}
                        <Button onClick={this.handleReset} size="sm" variant="outline" className="mt-2">
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}

export function useErrorHandler() {
    const [, setError] = React.useState()

    return React.useCallback((error: Error) => {
        setError(() => {
            throw error
        })
    }, [])
}
