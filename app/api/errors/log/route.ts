import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

interface ErrorLog {
    message: string
    stack?: string
    componentStack?: string
    level: string
    timestamp: string
    userAgent: string
    url: string
}

export async function POST(req: NextRequest) {
    try {
        const errorData: ErrorLog = await req.json()

        if (!errorData.message || !errorData.timestamp) {
            return NextResponse.json({ error: 'Invalid error data' }, { status: 400 })
        }

        if (process.env.NODE_ENV === 'development') {
            console.error('Client Error Logged:', {
                message: errorData.message,
                level: errorData.level,
                url: errorData.url,
                timestamp: errorData.timestamp,
            })
        }

        Sentry.captureMessage(errorData.message, {
            level: errorData.level === 'error' ? 'error' : 'warning',
            contexts: {
                clientError: {
                    stack: errorData.stack,
                    componentStack: errorData.componentStack,
                    userAgent: errorData.userAgent,
                    url: errorData.url,
                    timestamp: errorData.timestamp,
                },
            },
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Error logging error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
