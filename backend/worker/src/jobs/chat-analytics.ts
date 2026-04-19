import { queueNames } from "@echo/shared";
import { db } from "../lib/db.js";
import { analyticsLogs } from "../lib/schema.js";
import { createQueueWorker } from "../lib/queues.js";
import { logger } from "../lib/logger.js";

export const chatAnalyticsWorker = createQueueWorker(queueNames.analytics, async (job) => {
  if (job.name !== "log-chat") {
    return;
  }

  const { sessionId, query, response } = job.data as {
    sessionId: string;
    query: string;
    response: string;
  };

  try {
    await db.insert(analyticsLogs).values({
      sessionId,
      userQuery: query,
      agentResponse: response,
    });

    logger.info({ sessionId }, "Stored chat analytics log");
  } catch (error) {
    logger.error({ error, sessionId }, "Failed to persist chat analytics log");
  }
});
