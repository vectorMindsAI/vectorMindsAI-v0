import { describe, it, expect, vi } from 'vitest';
import { logger, logServerInfo, logServerWarn, logServerError } from '../lib/logger';

describe('Logger Module', () => {
    it('should log info messages without throwing', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        logger.info('Test info message', { module: 'test' });
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('should log server info and warn messages', () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        logServerInfo('Server initialized');
        logServerWarn('Low disk space');

        expect(logSpy).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalled();

        logSpy.mockRestore();
        warnSpy.mockRestore();
    });

    it('should track API call duration and return result', async () => {
        vi.spyOn(console, 'info').mockImplementation(() => {});

        const apiCall = async () => 'api-result';
        const result = await logger.trackApiCall('/api/test', apiCall);

        expect(result).toBe('api-result');
    });

    it('should catch and rethrow API call errors', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});

        const failingCall = async () => {
            throw new Error('Network failure');
        };

        await expect(logger.trackApiCall('/api/fail', failingCall)).rejects.toThrow('Network failure');
    });
});
