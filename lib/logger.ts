import * as Sentry from '@sentry/nextjs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
    [key: string]: any
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development'
    private isClient = typeof window !== 'undefined'
    debug(message: string, context?: LogContext) {
        if (this.isDevelopment) {
            this.log('debug', message, context)
        }
    }
    info(message: string, context?: LogContext) {
        this.log('info', message, context)
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context)
    }

    error(message: string, error?: Error | unknown, context?: LogContext) {
        const errorContext = {
            ...context,
            ...(error instanceof Error && {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
            }),
        }

        this.log('error', message, errorContext)

        // Send to Sentry
        if (error instanceof Error) {
            Sentry.captureException(error, {
                contexts: {
                    logger: errorContext,
                },
                tags: {
                    component: context?.component || 'unknown',
                },
            })
        } else {
            Sentry.captureMessage(message, {
                level: 'error',
                contexts: {
                    logger: errorContext,
                },
                tags: {
                    component: context?.component || 'unknown',
                },
            })
        }

        // Send to analytics
        if (this.isClient && (window as any).analytics) {
            try {
                (window as any).analytics.track('client_error', {
                    component: context?.component || 'unknown',
                    errorMessage: message,
                    ...errorContext,
                })
            } catch (e) {
                console.error('Failed to track error:', e)
            }
        }
    }

    private log(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString()
        const logData = {
            timestamp,
            level,
            message,
            ...context,
        }

        const consoleMethod = level === 'debug' ? console.log : console[level]

        if (this.isDevelopment) {
            consoleMethod(
                `[${timestamp}] ${level.toUpperCase()}: ${message}`,
                context ? context : ''
            )
        } else {
            consoleMethod(JSON.stringify(logData))
        }

        if (!this.isDevelopment && level === 'error' && this.isClient) {
            fetch('/api/errors/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...logData,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                }),
            }).catch((err) => {
                console.error('Failed to send log to server:', err)
            })
        }
    }

    async trackApiCall<T>(
        endpoint: string,
        apiCall: () => Promise<T>,
        context?: LogContext
    ): Promise<T> {
        const startTime = Date.now()
        const callContext = { endpoint, ...context }

        this.info(`API call started: ${endpoint}`, callContext)

        try {
            const result = await apiCall()
            const duration = Date.now() - startTime

            this.info(`API call completed: ${endpoint}`, {
                ...callContext,
                duration,
                success: true,
            })

            if (this.isClient && (window as any).analytics) {
                (window as any).analytics.track('api_response_time', {
                    endpoint,
                    duration,
                    success: true,
                })
            }

            return result
        } catch (error) {
            const duration = Date.now() - startTime

            this.error(`API call failed: ${endpoint}`, error, {
                ...callContext,
                duration,
                success: false,
            })

            if (this.isClient && (window as any).analytics) {
                (window as any).analytics.track('api_response_time', {
                    endpoint,
                    duration,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }

            throw error
        }
    }
    trackAction(action: string, context?: LogContext) {
        this.info(`User action: ${action}`, context)

        if (this.isClient && (window as any).analytics) {
            (window as any).analytics.track(action, context)
        }
    }
}

export const logger = new Logger()

export function logServerError(
    message: string,
    error: Error | unknown,
    context?: LogContext
) {
    const errorData = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        ...context,
        ...(error instanceof Error && {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
        }),
    }

    if (process.env.NODE_ENV === 'development') {
        console.error('[SERVER ERROR]', message, errorData)
    } else {
        console.error(JSON.stringify(errorData))
    }

    // Send to Sentry
    if (error instanceof Error) {
        Sentry.captureException(error, {
            contexts: {
                logger: errorData,
            },
            tags: {
                source: 'server',
                endpoint: context?.endpoint || 'unknown',
            },
        })
    } else {
        Sentry.captureMessage(message, {
            level: 'error',
            contexts: {
                logger: errorData,
            },
            tags: {
                source: 'server',
                endpoint: context?.endpoint || 'unknown',
            },
        })
    }
}

export function logServerInfo(message: string, context?: LogContext) {
    const logData = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        ...context,
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('[SERVER INFO]', message, context || '')
    } else {
        console.log(JSON.stringify(logData))
    }
}

export function logServerWarn(message: string, context?: LogContext) {
    const logData = {
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        ...context,
    }

    if (process.env.NODE_ENV === 'development') {
        console.warn('[SERVER WARN]', message, context || '')
    } else {
        console.warn(JSON.stringify(logData))
    }
}
