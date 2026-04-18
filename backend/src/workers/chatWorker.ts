import { Worker } from 'bullmq';
import { redisConnection } from './workerSetup';
import { db } from '../db/index';
import { analyticsLogs } from '../db/schema';

export const chatWorker = new Worker(
    'chat-analytics',
    async (job) => {
        if (job.name === 'log-chat') {
            const { sessionId, query, response } = job.data;
            try {
                await db.insert(analyticsLogs).values({
                    sessionId: sessionId,
                    userQuery: query,
                    agentResponse: response
                });
                console.log(`[ChatWorker] Async log stored successfully for thread: ${sessionId}`);
            } catch (err) {
                console.error('[ChatWorker] Failed async insert:', err);
            }
        }
    },
    { connection: redisConnection }
);
