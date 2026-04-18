import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis connection - defaults to localhost:6379 via standard docker
export const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Queue instance to throw logs into
export const analyticsQueue = new Queue('chat-analytics', { connection: redisConnection });

// We also need another queue for the map-reduce tasks natively if we want, but Repeatable Jobs usually sit in a specific maintenance queue.
export const maintenanceQueue = new Queue('maintenance-jobs', { connection: redisConnection });

export async function setupCronJobs() {
    // Adds the Reduce worker to run nightly
    await maintenanceQueue.add(
        'reduce-daily-insights',
        {},
        {
            repeat: { pattern: '0 0 * * *' }, // Nightly at midnight UTC
            jobId: 'reduce-daily-insights' // Prevents duplicate registrations
        }
    );

    // Adds the Map worker to run hourly
    await maintenanceQueue.add(
        'map-hourly-logs',
        {},
        {
            repeat: { pattern: '0 * * * *' }, // Hourly
            jobId: 'map-hourly-logs' 
        }
    );
    
    console.log('BullMQ Cron Jobs successfully registered to Redis.');
}
