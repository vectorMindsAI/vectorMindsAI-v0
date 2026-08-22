import { describe, it, expect, beforeEach } from 'vitest';
import { cache, cacheKeys, cacheTTL } from '../lib/cache';

describe('In-Memory Cache System', () => {
    beforeEach(() => {
        cache.clear();
    });

    it('should set and get values correctly', () => {
        const key = cacheKeys.research('Tokyo');
        const data = { city: 'Tokyo', summary: 'Clean and safe' };

        cache.set(key, data, cacheTTL.research);
        const result = cache.get(key);

        expect(result).toEqual(data);
    });

    it('should return null for expired entries', async () => {
        const key = 'test:expire';
        cache.set(key, { value: 123 }, 0.05); // 0.05 seconds = 50ms TTL

        expect(cache.get(key)).toEqual({ value: 123 });

        await new Promise((resolve) => setTimeout(resolve, 80));

        expect(cache.get(key)).toBeNull();
    });

    it('should delete specified pattern of keys', () => {
        cache.set('user:101:history', 'data1', 1000);
        cache.set('user:101:stats', 'data2', 1000);
        cache.set('user:102:history', 'data3', 1000);

        const count = cache.deletePattern('user:101:');
        expect(count).toBe(2);
        expect(cache.get('user:101:history')).toBeNull();
        expect(cache.get('user:102:history')).toBe('data3');
    });

    it('should track statistics correctly', () => {
        cache.set('key1', 'val1', 1000);
        cache.get('key1'); // Hit
        cache.get('missing'); // Miss

        const stats = cache.getStats();
        expect(stats.totalEntries).toBe(1);
        expect(stats.totalHits).toBeGreaterThanOrEqual(1);
        expect(stats.totalMisses).toBeGreaterThanOrEqual(1);
    });
});
