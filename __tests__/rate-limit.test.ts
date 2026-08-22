import { describe, it, expect } from 'vitest';
import { rateLimit } from '../lib/rate-limit';
import { NextRequest } from 'next/server';

describe('Rate Limiter', () => {
    it('should allow requests under the configured limit', async () => {
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            max: 5,
            message: 'Too many requests',
        });

        const req = new NextRequest('http://localhost:3000/api/test', {
            headers: { 'x-forwarded-for': '127.0.0.1' },
        });

        const response = await limiter(req);
        expect(response).toBeNull();
    });

    it('should block requests exceeding the limit with 429 status', async () => {
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            max: 2,
            message: 'Too many requests',
        });

        const req = new NextRequest('http://localhost:3000/api/test-limit', {
            headers: { 'x-forwarded-for': '192.168.1.1' },
        });

        await limiter(req); // 1st
        await limiter(req); // 2nd
        const blockedResponse = await limiter(req); // 3rd (blocked)

        expect(blockedResponse).not.toBeNull();
        expect(blockedResponse?.status).toBe(429);
    });
});
