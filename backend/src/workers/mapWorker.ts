import { Worker } from 'bullmq';
import { redisConnection } from './workerSetup';
import { db } from '../db/index';
import { analyticsLogs, mappedSummaries } from '../db/schema';
import { eq } from 'drizzle-orm';
import { chatModel } from '../agent';

export const mapWorker = new Worker(
    'maintenance-jobs',
    async (job) => {
        if (job.name === 'map-hourly-logs') {
            console.log('[MapWorker] Running hourly analytics ingestion...');
            await processMapJob();
        }
    },
    { connection: redisConnection }
);

export async function processMapJob() {
    try {
        // Query analytics_logs where processed = false limit 100
        const logs = await db.select()
            .from(analyticsLogs)
            .where(eq(analyticsLogs.processed, false))
            .limit(100);

        if (logs.length === 0) {
            console.log('[MapWorker] No unprocessed logs found.');
            return;
        }

        // We prepare a strict extraction instruction to compress the text blob into structured JSON
        const rawText = logs.map(l => `Query: ${l.userQuery} | Response: ${l.agentResponse}`).join('\n---\n');
        const prompt = `Analyze these ${logs.length} chat logs. Return a strict JSON array of the top 3 friction points you identify, their estimated frequency, and an average sentiment score (-1 to 1).
        
        Logs:
        ${rawText}

        Respond ONLY with a JSON map in the exact format:
        {"top_issues": [{"name": "Issue", "count": 10}], "avg_sentiment": 0.5}`;

        const res = await chatModel.invoke(prompt);
        let content = res.content as string;
        
        // Clean JSON tags from markdown format if any
        content = content.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '');
        const data = JSON.parse(content);

        await db.transaction(async (tx) => {
            // Save to mapping table
            await tx.insert(mappedSummaries).values({
                timeWindow: new Date(), // using literal JS execution time for hourly window logic
                frictionData: data,
            });

            // Mark logs as processed
            for (const item of logs) {
                await tx.update(analyticsLogs)
                    .set({ processed: true })
                    .where(eq(analyticsLogs.id, item.id));
            }
        });

        console.log(`[MapWorker] Successfully mapped ${logs.length} insights.`);
    } catch (err) {
        console.error('[MapWorker] Failed to run Map Reduce step:', err);
    }
}
