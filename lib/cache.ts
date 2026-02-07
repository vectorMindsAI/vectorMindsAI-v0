interface CacheEntry<T> {
    value: T
    expiresAt: number
    createdAt: number
    hits: number
}

interface CacheStats {
    totalEntries: number
    totalHits: number
    totalMisses: number
    memoryUsage: number
    oldestEntry: number | null
    newestEntry: number | null
}

class Cache {
    private store: Map<string, CacheEntry<any>> = new Map()
    private stats = {
        hits: 0,
        misses: 0,
    }

    private escapeRegex(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    constructor() {
        setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }
    get<T>(key: string): T | null {
        const entry = this.store.get(key)

        if (!entry) {
            this.stats.misses++
            return null
        }

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key)
            this.stats.misses++
            return null
        }

        entry.hits++
        this.stats.hits++

        return entry.value as T
    }

    set<T>(key: string, value: T, ttlSeconds: number): void {
        const now = Date.now()
        
        this.store.set(key, {
            value,
            expiresAt: now + ttlSeconds * 1000,
            createdAt: now,
            hits: 0,
        })
    }

    delete(key: string): boolean {
        return this.store.delete(key)
    }

    deletePattern(pattern: string): number {
        let count = 0
        const regex = new RegExp(pattern)

        for (const key of this.store.keys()) {
            if (regex.test(key)) {
                this.store.delete(key)
                count++
            }
        }

        return count
    }

    deleteByPrefix(prefix: string): number {
        const escapedPrefix = this.escapeRegex(prefix)
        const regex = new RegExp('^' + escapedPrefix)
        let count = 0

        for (const key of this.store.keys()) {
            if (regex.test(key)) {
                this.store.delete(key)
                count++
            }
        }

        return count
    }

    has(key: string): boolean {
        return this.get(key) !== null
    }

    clear(): void {
        this.store.clear()
        this.stats.hits = 0
        this.stats.misses = 0
    }
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlSeconds: number
    ): Promise<T> {
        const cached = this.get<T>(key)
        if (cached !== null) {
            return cached
        }

        const value = await fetchFn()
        this.set(key, value, ttlSeconds)
        return value
    }
    private cleanup(): void {
        const now = Date.now()
        let cleaned = 0

        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key)
                cleaned++
            }
        }

        if (cleaned > 0) {
            console.log(`[Cache] Cleaned ${cleaned} expired entries`)
        }
    }

    getStats(): CacheStats {
        const entries = Array.from(this.store.entries())

        let memoryUsage = 0
        for (const [key, entry] of entries) {
            memoryUsage += key.length * 2 
            memoryUsage += JSON.stringify(entry.value).length * 2
            memoryUsage += 32 
        }

        return {
            totalEntries: this.store.size,
            totalHits: this.stats.hits,
            totalMisses: this.stats.misses,
            memoryUsage,
            oldestEntry: entries.length > 0
                ? Math.min(...entries.map(([, e]) => e.createdAt))
                : null,
            newestEntry: entries.length > 0
                ? Math.max(...entries.map(([, e]) => e.createdAt))
                : null,
        }
    }

    keys(): string[] {
        return Array.from(this.store.keys())
    }

    inspect(key: string): CacheEntry<any> | null {
        const entry = this.store.get(key)
        return entry || null
    }

    getEntries(): Array<{ key: string; expiresAt: number; createdAt: number; hits: number }> {
        const entries: Array<{ key: string; expiresAt: number; createdAt: number; hits: number }> = []
        
        for (const [key, entry] of this.store.entries()) {
            entries.push({
                key,
                expiresAt: entry.expiresAt,
                createdAt: entry.createdAt,
                hits: entry.hits,
            })
        }

        return entries.sort((a, b) => b.createdAt - a.createdAt)
    }
}

export const cache = new Cache()

export const cacheKeys = {
    research: (query: string) => `research:${hashString(query)}`,
    researchExtended: (query: string) => `research:extended:${hashString(query)}`,
    
    user: (userId: string) => `user:${userId}`,
    userByEmail: (email: string) => `user:email:${email}`,
    
    agentJob: (jobId: string) => `agent:job:${jobId}`,
    userJobs: (userId: string) => `agent:jobs:${userId}`,
    
    searchHistory: (userId: string) => `history:${userId}`,
    searchHistoryItem: (id: string) => `history:item:${id}`,
    
    planner: (query: string) => `planner:${hashString(query)}`,
}

function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash 
    }
    return Math.abs(hash).toString(36)
}

// Cache TTL configurations (in seconds)
export const cacheTTL = {
    research: 60 * 60,
    researchExtended: 60 * 60 * 2,
    user: 60 * 15,
    agentJob: 60 * 5,
    searchHistory: 60 * 10,
    planner: 60 * 30,
    default: 60 * 5,
}

export { Cache }
export type { CacheEntry, CacheStats }
