import { NextRequest, NextResponse } from 'next/server'
interface RateLimitStore {
    [key: string]: {
        count: number
        resetTime: number
    }
}

const store: RateLimitStore = {}

setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key]
        }
    })
}, 5 * 60 * 1000)

export const rateLimitConfig = {
    standard: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
    },

    auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts, please try again later.',
    },

    research: {
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: 'Research request limit reached. Please try again later.',
    },

    agent: {
        windowMs: 60 * 60 * 1000,
        max: 5,
        message: 'Agent execution limit reached. Please try again later.',
    },

    database: {
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Database request limit reached. Please try again later.',
    },
}

function getClientId(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    return ip
}

export function rateLimit(config: {
    windowMs: number
    max: number
    message: string
}) {
    return async (req: NextRequest): Promise<NextResponse | null> => {
        const clientId = getClientId(req)
        const key = `${clientId}:${req.nextUrl.pathname}`
        const now = Date.now()

        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 0,
                resetTime: now + config.windowMs,
            }
        }

        store[key].count++

        // Check if limit exceeded
        if (store[key].count > config.max) {
            const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)
            return NextResponse.json(
                {
                    error: config.message,
                    retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': String(config.max),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(store[key].resetTime / 1000)),
                        'Retry-After': String(retryAfter),
                    },
                }
            )
        }
        return null
    }
}

export const standardLimiter = rateLimit(rateLimitConfig.standard)
export const authLimiter = rateLimit(rateLimitConfig.auth)
export const researchLimiter = rateLimit(rateLimitConfig.research)
export const agentLimiter = rateLimit(rateLimitConfig.agent)
export const databaseLimiter = rateLimit(rateLimitConfig.database)
