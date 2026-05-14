import { randomUUID } from "node:crypto";
import { pool } from "../../lib/db.js";

export type AgentChatScope = {
  agentId: string;
  userId: string;
  agentName: string;
  greetingMessage: string;
  fallbackMessage: string;
  isActive: boolean;
  publicAgentKey: string;
  modelProvider: string;
  generationModel: string;
  embeddingModel: string;
};

export type ConversationRecord = {
  id: string;
  channel: "playground" | "widget";
};

export type MessageRecord = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  confidenceScore: number | null;
  retrievalStrategy: string | null;
  createdAt: string;
};

export class ChatRepository {
  async findAgentScopeByIdForUser(userId: string, agentId: string): Promise<AgentChatScope | null> {
    const result = await pool.query<AgentChatScope>(
      `
        SELECT
          id AS "agentId",
          user_id AS "userId",
          name AS "agentName",
          COALESCE(welcome_message, greeting_message, 'Hi. Ask me anything about this product.') AS "greetingMessage",
          COALESCE(fallback_message, 'I do not have enough information from the available support docs to answer that confidently.') AS "fallbackMessage",
          (status = 'active' OR is_active = TRUE) AS "isActive",
          public_agent_key AS "publicAgentKey",
          model_provider AS "modelProvider",
          generation_model AS "generationModel",
          embedding_model AS "embeddingModel"
        FROM agents
        WHERE id = $1
          AND user_id = $2
          AND status <> 'archived'
        LIMIT 1
      `,
      [agentId, userId],
    );

    return result.rows[0] ?? null;
  }

  async findConversation(userId: string, agentId: string, conversationId: string): Promise<ConversationRecord | null> {
    const result = await pool.query<ConversationRecord>(
      `
        SELECT id, source AS channel
        FROM conversations
        WHERE id = $1
          AND user_id = $2
          AND agent_id = $3
        LIMIT 1
      `,
      [conversationId, userId, agentId],
    );

    return result.rows[0] ?? null;
  }

  async createConversation(input: {
    userId: string;
    agentId: string;
    channel: "playground" | "widget";
    sessionId?: string;
    visitorId?: string;
  }) {
    const result = await pool.query<ConversationRecord>(
      `
        INSERT INTO conversations (
          user_id,
          company_id,
          agent_id,
          source,
          session_id,
          customer_id,
          started_at,
          last_message_at,
          updated_at
        )
        VALUES ($1, $1, $2, $3, $4, $5, NOW(), NOW(), NOW())
        RETURNING id, source AS channel
      `,
      [input.userId, input.agentId, input.channel, input.sessionId || randomUUID(), input.visitorId ?? null],
    );

    return result.rows[0];
  }

  async listMessages(conversationId: string, limit = 20): Promise<MessageRecord[]> {
    const result = await pool.query<MessageRecord>(
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
        LIMIT $2
      `,
      [conversationId, limit],
    );

    return result.rows;
  }

  async insertMessage(input: {
    userId: string;
    agentId: string;
    conversationId: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    retrievalStrategy?: string;
    confidenceScore?: number;
  }): Promise<MessageRecord> {
    const result = await pool.query<MessageRecord>(
      `
        INSERT INTO messages (
          user_id,
          agent_id,
          conversation_id,
          role,
          content,
          retrieval_strategy,
          confidence_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          lower(role) AS role,
          content,
          confidence_score AS "confidenceScore",
          retrieval_strategy AS "retrievalStrategy",
          created_at AS "createdAt"
      `,
      [
        input.userId,
        input.agentId,
        input.conversationId,
        input.role,
        input.content,
        input.retrievalStrategy ?? null,
        input.confidenceScore ?? null,
      ],
    );

    await pool.query(
      `
        UPDATE conversations
        SET last_message_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `,
      [input.conversationId],
    );

    return result.rows[0];
  }

}
