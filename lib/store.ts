import fs from 'fs';
import path from 'path';
import dbConnect from './mongodb';
import AgentJob from './models/AgentJob';

const DB_PATH = path.join(process.cwd(), 'jobs_db.json');

export interface Job {
    id: string;
    status: 'pending' | 'queued' | 'processing' | 'waiting_for_selection' | 'completed' | 'failed';
    progress: number;
    logs: { type: string; message: string; timestamp: number }[];
    result: any | null;
    candidateLinks?: { url: string; title: string; snippet: string }[];
    createdAt: number;
}

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

export const jobStore = {
    create: async (id: string, userId?: string, plan?: any): Promise<Job> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
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
            console.error('Error saving job to MongoDB:', error);
        }

        return newJob;
    },

    update: async (id: string, updates: Partial<Job>): Promise<Job | null> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        if (!jobs[id]) return null;

        jobs[id] = { ...jobs[id], ...updates };
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));

        try {
            await dbConnect();
            await AgentJob.findOneAndUpdate(
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
        } catch (error) {
            console.error('Error updating job in MongoDB:', error);
        }

        return jobs[id];
    },

    addLog: async (id: string, log: { type: string; message: string }): Promise<void> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        if (!jobs[id]) return;

        const logEntry = { ...log, timestamp: Date.now() };
        jobs[id].logs.push(logEntry);
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));

        try {
            await dbConnect();
            await AgentJob.findOneAndUpdate(
                { jobId: id },
                {
                    $push: { logs: logEntry },
                }
            );
        } catch (error) {
            console.error('Error adding log to MongoDB:', error);
        }
    },

    get: async (id: string): Promise<Job | null> => {
        try {
            if (!fs.existsSync(DB_PATH)) return null;
            const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
            return jobs[id] || null;
        } catch (e) {
            return null;
        }
    }
};
