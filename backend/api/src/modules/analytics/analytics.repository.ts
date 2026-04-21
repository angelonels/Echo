import { pool } from "../../lib/db.js"

export class AnalyticsRepository {
  async getSummary(agentId: string) {
    const [conversationResult, messageResult, analyticsResult] = await Promise.all([
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM conversations WHERE agent_id = $1`, [agentId]),
      pool.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE c.agent_id = $1
        `,
        [agentId],
      ),
      pool.query<{
        fallbackRate: number | null
        avgConfidence: number | null
        totalLogs: string
        fallbackCount: string
      }>(
        `
          SELECT
            COALESCE(AVG(CASE WHEN fallback_used THEN 1 ELSE 0 END), 0) AS "fallbackRate",
            COALESCE(AVG(NULLIF(confidence_score, 0)), 0) AS "avgConfidence",
            COUNT(*)::text AS "totalLogs",
            COUNT(*) FILTER (WHERE fallback_used)::text AS "fallbackCount"
          FROM analytics_logs
          WHERE agent_id = $1
        `,
        [agentId],
      ),
    ])

    return {
      totalConversations: Number(conversationResult.rows[0]?.count ?? 0),
      totalMessages: Number(messageResult.rows[0]?.count ?? 0),
      fallbackRate: Number(analyticsResult.rows[0]?.fallbackRate ?? 0),
      avgConfidence: Number(analyticsResult.rows[0]?.avgConfidence ?? 0),
      totalLogs: Number(analyticsResult.rows[0]?.totalLogs ?? 0),
      fallbackCount: Number(analyticsResult.rows[0]?.fallbackCount ?? 0),
    }
  }

  async getTopQuestions(agentId: string) {
    const result = await pool.query<{ question: string; count: number }>(
      `
        SELECT user_query AS question, COUNT(*)::int AS count
        FROM analytics_logs
        WHERE agent_id = $1
        GROUP BY user_query
        ORDER BY count DESC, question ASC
        LIMIT 8
      `,
      [agentId],
    )

    return result.rows
  }
}
