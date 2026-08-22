import { describe, it, expect } from 'vitest';
import { jobStore } from '../lib/store';

describe('Job Store (Filesystem)', () => {
    it('should create and retrieve a job', async () => {
        const jobId = `test-job-${Date.now()}`;
        const newJob = await jobStore.create(jobId, 'user-123', {
            type: 'research',
            keywords: ['test'],
            criteria: 'general',
            model: 'test-model',
        });

        expect(newJob.id).toBe(jobId);
        expect(newJob.status).toBe('pending');

        const retrieved = await jobStore.get(jobId);
        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(jobId);
    });

    it('should update job fields', async () => {
        const jobId = `test-job-update-${Date.now()}`;
        await jobStore.create(jobId);

        const updated = await jobStore.update(jobId, {
            status: 'processing',
            progress: 50,
        });

        expect(updated?.status).toBe('processing');
        expect(updated?.progress).toBe(50);
    });

    it('should add log entries to job', async () => {
        const jobId = `test-job-log-${Date.now()}`;
        await jobStore.create(jobId);

        await jobStore.addLog(jobId, { type: 'INFO', message: 'Task started' });

        const job = await jobStore.get(jobId);
        expect(job?.logs.length).toBeGreaterThanOrEqual(1);
        expect(job?.logs[0].message).toBe('Task started');
    });
});
