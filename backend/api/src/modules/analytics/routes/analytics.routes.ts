import { Router } from "express";
import { desc } from "drizzle-orm";
import { AnalyticsPipelineStep, analyticsTriggerSchema } from "@echo/shared";
import { db } from "../../../lib/db.js";
import { dailyInsights, mappedSummaries } from "../../../lib/schema.js";
import { sendValidationError } from "../../../lib/http.js";
import { maintenanceQueue } from "../../../lib/queues.js";

export const analyticsRouter = Router();

analyticsRouter.get("/daily", async (_request, response) => {
  try {
    const latestInsights = await db.select().from(dailyInsights).orderBy(desc(dailyInsights.reportDate)).limit(1);
    const recentSummaries = await db.select().from(mappedSummaries).orderBy(desc(mappedSummaries.timeWindow)).limit(24);

    response.status(200).json({
      today: latestInsights[0] || null,
      timeline: recentSummaries.reverse(),
    });
  } catch (error) {
    response.status(500).json({ error: "Internal server error while fetching analytics" });
  }
});

analyticsRouter.post("/trigger", async (request, response) => {
  const parsed = analyticsTriggerSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return sendValidationError(response, parsed.error.format());
  }

  const step = parsed.data.step ?? AnalyticsPipelineStep.Full;

  try {
    if (step === AnalyticsPipelineStep.Map || step === AnalyticsPipelineStep.Full) {
      await maintenanceQueue.add("map-hourly-logs", {}, { removeOnComplete: 10, removeOnFail: 10 });
    }

    if (step === AnalyticsPipelineStep.Reduce || step === AnalyticsPipelineStep.Full) {
      await maintenanceQueue.add("reduce-daily-insights", {}, { removeOnComplete: 10, removeOnFail: 10 });
    }

    response.status(202).json({ message: "Worker trigger queued successfully", step });
  } catch (error) {
    response.status(500).json({ error: "Worker execution failed" });
  }
});
