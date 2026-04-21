import { db } from "../lib/db.js"
import { analyticsLogs } from "../lib/schema.js"
import { logger } from "../lib/logger.js"

export class ChatAnalyticsLogService {
  async store(input: {
    companyId?: string
    agentId?: string
    conversationId?: string
    source?: string
    sessionId: string
    query: string
    response: string
    strategy?: string
    confidence?: number
    fallbackUsed?: boolean
  }) {
    try {
      await db.insert(analyticsLogs).values({
        companyId: input.companyId ?? "default-company",
        agentId: input.agentId ?? "default-agent",
        conversationId: input.conversationId ?? null,
        source: input.source ?? "PLAYGROUND",
        sessionId: input.sessionId,
        userQuery: input.query,
        agentResponse: input.response,
        retrievalStrategy: input.strategy ?? null,
        confidenceScore: input.confidence ?? null,
        fallbackUsed: input.fallbackUsed ?? false,
      })

      logger.info({ sessionId: input.sessionId }, "Stored chat analytics log")
    } catch (error) {
      logger.error({ error, sessionId: input.sessionId }, "Failed to persist chat analytics log")
    }
  }
}
