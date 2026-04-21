import { randomUUID } from "node:crypto"
import { pool } from "../../lib/db.js"

export type AgentChatScope = {
  agentId: string
  companyId: string
  agentName: string
  greetingMessage: string
  isActive: boolean
  publicAgentKey: string
  allowedDomains: string[]
}

export type ConversationRecord = {
  id: string
  source: "PLAYGROUND" | "WIDGET"
}

export type MessageRecord = {
  id: string
  role: "USER" | "ASSISTANT"
  content: string
  confidenceScore: number | null
  retrievalStrategy: string | null
  createdAt: string
}

export class ChatRepository {
  async findAgentScopeById(agentId: string): Promise<AgentChatScope | null> {
    const result = await pool.query<AgentChatScope>(
      `
        SELECT
          a.id AS "agentId",
          o.slug AS "companyId",
          a.name AS "agentName",
          a.greeting_message AS "greetingMessage",
          a.is_active AS "isActive",
          a.public_api_key::text AS "publicAgentKey",
          COALESCE(
            (
              SELECT jsonb_agg(domain ORDER BY domain)
              FROM allowed_domains
              WHERE agent_id = a.id
            ),
            a.allowed_domains,
            '[]'::jsonb
          ) AS "allowedDomains"
        FROM agents a
        JOIN organizations o ON o.id = a.org_id
        WHERE a.id = $1
        LIMIT 1
      `,
      [agentId],
    )

    return this.normalizeScope(result.rows[0] ?? null)
  }

  async findAgentScopeByPublicKey(agentKey: string): Promise<AgentChatScope | null> {
    const normalizedKey = agentKey.replace(/^echo_pub_/, "")
    const result = await pool.query<AgentChatScope>(
      `
        SELECT
          a.id AS "agentId",
          o.slug AS "companyId",
          a.name AS "agentName",
          a.greeting_message AS "greetingMessage",
          a.is_active AS "isActive",
          a.public_api_key::text AS "publicAgentKey",
          COALESCE(
            (
              SELECT jsonb_agg(domain ORDER BY domain)
              FROM allowed_domains
              WHERE agent_id = a.id
            ),
            a.allowed_domains,
            '[]'::jsonb
          ) AS "allowedDomains"
        FROM agents a
        JOIN organizations o ON o.id = a.org_id
        WHERE a.public_api_key::text = $1
        LIMIT 1
      `,
      [normalizedKey],
    )

    return this.normalizeScope(result.rows[0] ?? null)
  }

  async findConversation(agentId: string, conversationId: string): Promise<ConversationRecord | null> {
    const result = await pool.query<ConversationRecord>(
      `
        SELECT id, source
        FROM conversations
        WHERE id = $1 AND agent_id = $2
        LIMIT 1
      `,
      [conversationId, agentId],
    )

    return result.rows[0] ?? null
  }

  async createConversation(input: {
    companyId: string
    agentId: string
    source: "PLAYGROUND" | "WIDGET"
    sessionId: string
    customerId?: string
  }) {
    const result = await pool.query<ConversationRecord>(
      `
        INSERT INTO conversations (
          company_id,
          agent_id,
          source,
          session_id,
          customer_id,
          started_at,
          last_message_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
        RETURNING id, source
      `,
      [input.companyId, input.agentId, input.source, input.sessionId || randomUUID(), input.customerId ?? null],
    )

    return result.rows[0]
  }

  async listMessages(conversationId: string, limit = 20): Promise<MessageRecord[]> {
    const result = await pool.query<MessageRecord>(
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
        LIMIT $2
      `,
      [conversationId, limit],
    )

    return result.rows
  }

  async insertMessage(input: {
    conversationId: string
    role: "USER" | "ASSISTANT"
    content: string
    retrievalStrategy?: string
    confidenceScore?: number
  }) {
    await pool.query(
      `
        INSERT INTO messages (
          conversation_id,
          role,
          content,
          retrieval_strategy,
          confidence_score
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        input.conversationId,
        input.role,
        input.content,
        input.retrievalStrategy ?? null,
        input.confidenceScore ?? null,
      ],
    )

    await pool.query(
      `
        UPDATE conversations
        SET last_message_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `,
      [input.conversationId],
    )
  }

  private normalizeScope(scope: AgentChatScope | null) {
    if (!scope) {
      return null
    }

    return {
      ...scope,
      allowedDomains: Array.isArray(scope.allowedDomains)
        ? scope.allowedDomains.filter((value): value is string => typeof value === "string")
        : [],
    }
  }
}
