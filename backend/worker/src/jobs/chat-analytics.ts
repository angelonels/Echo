import { queueNames } from "@echo/shared";
import { createQueueWorker } from "../lib/queues.js";
import { ChatAnalyticsLogService } from "../services/chat-analytics-log-service.js";

const chatAnalyticsLogService = new ChatAnalyticsLogService();

export const chatAnalyticsWorker = createQueueWorker(queueNames.analytics, async (job) => {
  if (job.name !== "log-chat") {
    return;
  }

  const {
    companyId,
    agentId,
    conversationId,
    source,
    sessionId,
    query,
    response,
    strategy,
    confidence,
    fallbackUsed,
  } = job.data as {
    companyId?: string;
    agentId?: string;
    conversationId?: string;
    source?: string;
    sessionId: string;
    query: string;
    response: string;
    strategy?: string;
    confidence?: number;
    fallbackUsed?: boolean;
  };

  await chatAnalyticsLogService.store({
    companyId,
    agentId,
    conversationId,
    source,
    sessionId,
    query,
    response,
    strategy,
    confidence,
    fallbackUsed,
  });
});
