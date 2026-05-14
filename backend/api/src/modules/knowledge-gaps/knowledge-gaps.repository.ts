import { pool } from "../../lib/db.js";

export class KnowledgeGapsRepository {
  async listKnowledgeGapsForAgent(userId: string, agentId: string) {
    const result = await pool.query(
      `
        SELECT
          id,
          title,
          description,
          status,
          example_questions AS "exampleQuestions",
          occurrence_count AS "occurrenceCount",
          first_seen_at AS "firstSeenAt",
          last_seen_at AS "lastSeenAt",
          suggested_faq_question AS "suggestedFaqQuestion",
          suggested_faq_answer AS "suggestedFaqAnswer",
          updated_at AS "updatedAt"
        FROM knowledge_gaps
        WHERE user_id = $1 AND agent_id = $2
        ORDER BY last_seen_at DESC
        LIMIT 50
      `,
      [userId, agentId],
    );

    return result.rows;
  }
}
