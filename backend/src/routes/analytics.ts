import express from 'express';
import { db } from '../db/index';
import { dailyInsights, mappedSummaries } from '../db/schema';
import { desc } from 'drizzle-orm';
import { processMapJob } from '../workers/mapWorker';
import { processReduceJob } from '../workers/reduceWorker';

const router = express.Router();

router.get('/daily', async (req, res) => {
    try {
        const latestInsights = await db.select()
            .from(dailyInsights)
            .orderBy(desc(dailyInsights.reportDate))
            .limit(1);
            
        const recentSummaries = await db.select()
            .from(mappedSummaries)
            .orderBy(desc(mappedSummaries.timeWindow))
            .limit(24);

        res.status(200).json({
            today: latestInsights[0] || null,
            timeline: recentSummaries.reverse()
        });
    } catch (err) {
        console.error('Analytics Fetch Error:', err);
        res.status(500).json({ error: 'Internal server error while fetching analytics' });
    }
});

// DEV: Endpoints to manual trigger workers immediately for debugging Phase 3
router.post('/trigger', async (req, res) => {
    try {
        const { step } = req.body;
        if (step === 'map') {
            await processMapJob();
        } else if (step === 'reduce') {
            await processReduceJob();
        } else {
             // Run Full Pipeline
            await processMapJob();
            await processReduceJob();
        }
        res.status(200).json({ message: 'Worker triggered successfully' });
    } catch (err) {
        console.error('Manual Trigger Error:', err);
        res.status(500).json({ error: 'Worker execution failed' });
    }
});

export default router;
