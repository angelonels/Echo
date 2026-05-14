import { pool } from "../../lib/db.js"

export class AnalyticsRepository {
  async getSummary(userId: string, agentId: string) {
    const [conversationResult, messageResult, analyticsResult] = await Promise.all([
      pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM conversations c
          WHERE c.agent_id = $1 AND c.user_id = $2
        `,
        [agentId, userId],
      ),
      pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE c.agent_id = $1 AND c.user_id = $2
        `,
        [agentId, userId],
      ),
      pool.query<{
        fallbackRate: number | null
        avgConfidence: number | null
        totalLogs: string
        fallbackCount: string
        avgLatencyMs: number | null
      }>(
        `
          SELECT
            COALESCE(AVG(CASE WHEN response_type = 'fallback' THEN 1 ELSE 0 END), 0) AS "fallbackRate",
            COALESCE(AVG(NULLIF(confidence, 0)), 0) AS "avgConfidence",
            COALESCE(AVG(latency_ms), 0) AS "avgLatencyMs",
            COUNT(*)::text AS "totalLogs",
            COUNT(*) FILTER (WHERE response_type = 'fallback')::text AS "fallbackCount"
          FROM retrieval_traces rt
          WHERE rt.agent_id = $1
            AND rt.user_id = $2
            AND rt.channel <> 'internal_eval'
        `,
        [agentId, userId],
      ),
    ])

    return {
      totalConversations: Number(conversationResult.rows[0]?.count ?? 0),
      totalMessages: Number(messageResult.rows[0]?.count ?? 0),
      fallbackRate: Number(analyticsResult.rows[0]?.fallbackRate ?? 0),
      avgConfidence: Number(analyticsResult.rows[0]?.avgConfidence ?? 0),
      avgLatencyMs: Number(analyticsResult.rows[0]?.avgLatencyMs ?? 0),
      totalLogs: Number(analyticsResult.rows[0]?.totalLogs ?? 0),
      fallbackCount: Number(analyticsResult.rows[0]?.fallbackCount ?? 0),
    }
  }

  async getTopQuestions(userId: string, agentId: string) {
    const result = await pool.query<{ question: string; count: number }>(
      `
        SELECT user_question AS question, COUNT(*)::int AS count
        FROM retrieval_traces rt
        WHERE rt.agent_id = $1
          AND rt.user_id = $2
          AND rt.channel <> 'internal_eval'
        GROUP BY user_question
        ORDER BY count DESC, question ASC
        LIMIT 8
      `,
      [agentId, userId],
    )

    return result.rows
  }
}
