import fs from 'fs';
import path from 'path';
import dbConnect from './mongodb';
import AgentJob from './models/AgentJob';
import { cache, cacheKeys } from './cache';
import { cacheInvalidation } from './cache-invalidation';
import { logServerError } from './logger';

const DB_PATH = path.join(process.cwd(), 'jobs_db.json');

export interface JobLog {
    type: string;
    message: string;
    timestamp: number;
}

export interface JobPlan {
    type: string;
    keywords: string[];
    criteria: string | string[];
    model: string;
    [key: string]: unknown;
}

export interface Job {
    id: string;
    status: 'pending' | 'queued' | 'processing' | 'waiting_for_selection' | 'completed' | 'failed';
    progress: number;
    logs: JobLog[];
    result: Record<string, unknown> | null;
    candidateLinks?: { url: string; title: string; snippet: string }[];
    createdAt: number;
}

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

export const jobStore = {
    create: async (id: string, userId?: string, plan?: JobPlan): Promise<Job> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Record<string, Job>;
        const newJob: Job = {
            id,
            status: 'pending',
            progress: 0,
            logs: [],
            result: null,
            createdAt: Date.now(),
        };
        jobs[id] = newJob;
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));

        try {
            await dbConnect();
            await AgentJob.create({
                jobId: id,
                userId,
                plan: plan || [],
                status: 'pending',
                progress: 0,
                logs: [],
                result: null,
            });
        } catch (error) {
            logServerError('Error saving job to MongoDB', error, { jobId: id });
        }

        return newJob;
    },

    update: async (id: string, updates: Partial<Job>): Promise<Job | null> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Record<string, Job>;
        if (!jobs[id]) return null;

        jobs[id] = { ...jobs[id], ...updates };
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));

        try {
            await dbConnect();
            const updatedJob = await AgentJob.findOneAndUpdate(
                { jobId: id },
                {
                    $set: {
                        status: updates.status,
                        progress: updates.progress,
                        result: updates.result,
                        candidateLinks: updates.candidateLinks,
                    },
                },
                { new: true }
            );

            cache.delete(cacheKeys.agentJob(id));

            if (updates.status === 'completed' && updatedJob?.userId) {
                cacheInvalidation.onJobComplete(id, updatedJob.userId);
            } else if (updates.status === 'failed' && updatedJob?.userId) {
                cacheInvalidation.onJobFailure(id, updatedJob.userId);
            }
        } catch (error) {
            logServerError('Error updating job in MongoDB', error, { jobId: id });
        }

        return jobs[id];
    },

    addLog: async (id: string, log: { type: string; message: string }): Promise<void> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Record<string, Job>;
        if (!jobs[id]) return;

        const logEntry: JobLog = { ...log, timestamp: Date.now() };
        jobs[id].logs.push(logEntry);
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));

        try {
            await dbConnect();
            await AgentJob.findOneAndUpdate(
                { jobId: id },
                { $push: { logs: logEntry } }
            );

            cache.delete(cacheKeys.agentJob(id));
        } catch (error) {
            logServerError('Error adding log to MongoDB', error, { jobId: id });
        }
    },

    get: async (id: string): Promise<Job | null> => {
        try {
            if (!fs.existsSync(DB_PATH)) return null;
            const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Record<string, Job>;
            return jobs[id] ?? null;
        } catch {
            return null;
        }
    },
};
