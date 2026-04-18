import { Worker } from 'bullmq';
import { redisConnection } from './workerSetup';
import { db } from '../db/index';
import { mappedSummaries, dailyInsights } from '../db/schema';
import { gte } from 'drizzle-orm';
import { chatModel } from '../agent';

export const reduceWorker = new Worker(
    'maintenance-jobs',
    async (job) => {
        if (job.name === 'reduce-daily-insights') {
            console.log('[ReduceWorker] Running daily insights rollup...');
            await processReduceJob();
        }
    },
    { connection: redisConnection }
);

export async function processReduceJob() {
    try {
        // Fetch all rows from mapped_summaries created in the last 24 hours
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const summaries = await db.select()
            .from(mappedSummaries)
            .where(gte(mappedSummaries.createdAt, twentyFourHoursAgo));

        if (summaries.length === 0) {
            console.log('[ReduceWorker] No mapped summaries found for the day.');
            return;
        }

        const rawText = summaries.map(s => JSON.stringify(s.frictionData)).join('\n---\n');

        const prompt = `You are a data analyst. Aggregate these hourly frequency maps into the definitive Top 5 Global Friction Points for the day. You must recalculate the true frequencies globally, ignoring minor disparities, grouping identical issues together. Average the overall sentiment correctly.
        
        Hourly Maps:
        ${rawText}

        Respond ONLY with a JSON map in the exact format:
        {"top_issues": [{"name": "Global Issue", "count": 100}], "avg_sentiment": 0.5}`;

        const res = await chatModel.invoke(prompt);
        let content = res.content as string;
        content = content.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '');
        const data = JSON.parse(content);

        // Standardize current date for report_date uniquely
        const today = new Date().toISOString().split('T')[0];

        await db.insert(dailyInsights).values({
            reportDate: today,
            topIssues: data.top_issues,
            avgSentiment: data.avg_sentiment,
        }).onConflictDoUpdate({
            target: dailyInsights.reportDate,
            set: {
                topIssues: data.top_issues,
                avgSentiment: data.avg_sentiment
            }
        });

        console.log(`[ReduceWorker] Successfully aggregated daily insights.`);
    } catch (err) {
        console.error('[ReduceWorker] Failed to run Reduce step:', err);
    }
}
