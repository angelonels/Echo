import { queueNames } from "@echo/shared";
import { createQueueWorker } from "../lib/queues.js";
import { AnalyticsAggregationService } from "../services/analytics-aggregation-service.js";

const analyticsAggregationService = new AnalyticsAggregationService();

export const maintenanceWorker = createQueueWorker(queueNames.maintenance, async (job) => {
  if (job.name === "map-hourly-logs") {
    await analyticsAggregationService.processMapJob();
    return;
  }

  if (job.name === "reduce-daily-insights") {
    await analyticsAggregationService.processReduceJob();
  }
});
