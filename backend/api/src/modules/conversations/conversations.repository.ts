import { pool } from "../../lib/db.js"

type ConversationSummaryRow = {
  id: string
  source: "playground" | "widget"
  startedAt: string
  lastMessageAt: string
  messageCount: number
  avgConfidence: number | null
}

type ConversationMessageRow = {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  confidenceScore: number | null
  retrievalStrategy: string | null
  createdAt: string
}

export class ConversationsRepository {
  async listConversations(userId: string, agentId: string): Promise<ConversationSummaryRow[]> {
    const result = await pool.query<ConversationSummaryRow>(
      `
        SELECT
          c.id,
          c.source,
          c.started_at AS "startedAt",
          c.last_message_at AS "lastMessageAt",
          COUNT(m.id)::int AS "messageCount",
          COALESCE(AVG(NULLIF(m.confidence_score, 0)), 0) AS "avgConfidence"
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.agent_id = $1 AND c.user_id = $2
        GROUP BY c.id
        ORDER BY c.last_message_at DESC
      `,
      [agentId, userId],
    )

    return result.rows
  }

  async getConversation(userId: string, agentId: string, conversationId: string) {
    const headerResult = await pool.query<{ id: string; source: "playground" | "widget" }>(
      `
        SELECT c.id, c.source
        FROM conversations c
        WHERE c.id = $1 AND c.agent_id = $2 AND c.user_id = $3
        LIMIT 1
      `,
      [conversationId, agentId, userId],
    )

    const header = headerResult.rows[0]
    if (!header) {
      return null
    }

    const messagesResult = await pool.query<ConversationMessageRow>(
      `
        SELECT
          id,
          lower(role) AS role,
          content,
          confidence_score AS "confidenceScore",
          retrieval_strategy AS "retrievalStrategy",
          created_at AS "createdAt"
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
      `,
      [conversationId],
    )

    return {
      id: header.id,
      source: header.source,
      messages: messagesResult.rows,
    }
  }
}
