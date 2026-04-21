import { pool } from "../../lib/db.js"

type ConversationSummaryRow = {
  id: string
  source: "PLAYGROUND" | "WIDGET"
  startedAt: string
  lastMessageAt: string
  messageCount: number
  avgConfidence: number | null
}

type ConversationMessageRow = {
  id: string
  role: "USER" | "ASSISTANT"
  content: string
  confidenceScore: number | null
  retrievalStrategy: string | null
  createdAt: string
}

export class ConversationsRepository {
  async listConversations(agentId: string): Promise<ConversationSummaryRow[]> {
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
        WHERE c.agent_id = $1
        GROUP BY c.id
        ORDER BY c.last_message_at DESC
      `,
      [agentId],
    )

    return result.rows
  }

  async getConversation(agentId: string, conversationId: string) {
    const headerResult = await pool.query<{ id: string; source: "PLAYGROUND" | "WIDGET" }>(
      `SELECT id, source FROM conversations WHERE id = $1 AND agent_id = $2 LIMIT 1`,
      [conversationId, agentId],
    )

    const header = headerResult.rows[0]
    if (!header) {
      return null
    }

    const messagesResult = await pool.query<ConversationMessageRow>(
      `
        SELECT
          id,
          role,
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
