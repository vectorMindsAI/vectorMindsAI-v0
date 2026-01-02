import { NextRequest, NextResponse } from 'next/server'

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
            return NextResponse.json(
                { error: 'Invalid error data' },
                { status: 400 }
            )
        }

        if (process.env.NODE_ENV === 'development') {
            console.error('Client Error Logged:', {
                message: errorData.message,
                level: errorData.level,
                url: errorData.url,
                timestamp: errorData.timestamp,
            })
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Error logged successfully'
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error logging error:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to log error'
            },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const level = searchParams.get('level')

        return NextResponse.json({
            errors: [],
            message: 'Error log retrieval not yet implemented',
        })
    } catch (error) {
        console.error('Error retrieving logs:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve error logs' },
            { status: 500 }
        )
    }
}
