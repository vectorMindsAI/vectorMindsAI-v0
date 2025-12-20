import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'jobs_db.json');

export interface Job {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    logs: { type: string; message: string; timestamp: number }[];
    result: any | null;
    createdAt: number;
}

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

export const jobStore = {
    create: async (id: string): Promise<Job> => {
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
        return newJob;
    },

    update: async (id: string, updates: Partial<Job>): Promise<Job | null> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        if (!jobs[id]) return null;

        jobs[id] = { ...jobs[id], ...updates };
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));
        return jobs[id];
    },

    addLog: async (id: string, log: { type: string; message: string }): Promise<void> => {
        const jobs = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        if (!jobs[id]) return;

        jobs[id].logs.push({ ...log, timestamp: Date.now() });
        fs.writeFileSync(DB_PATH, JSON.stringify(jobs, null, 2));
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
