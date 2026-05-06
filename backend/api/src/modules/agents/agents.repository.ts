import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { pool } from "../../lib/db.js";

export type AgentStatus = "draft" | "active" | "paused" | "archived";
export type AgentVisibility = "private" | "public";
export type RetrievalMode = "auto" | "naive" | "multi_query" | "hybrid";

export type AgentRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  publicAgentKey: string;
  status: AgentStatus;
  visibility: AgentVisibility;
  baseInstructions: string | null;
  welcomeMessage: string | null;
  fallbackMessage: string | null;
  retrievalMode: RetrievalMode;
  temperature: string;
  maxContextChunks: number;
  modelProvider: string;
  generationModel: string;
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
  conversationCount?: number;
};

export type AgentWriteInput = {
  name: string;
  description?: string | null;
  status?: AgentStatus;
  visibility?: AgentVisibility;
  baseInstructions?: string | null;
  welcomeMessage?: string | null;
  fallbackMessage?: string | null;
  retrievalMode?: RetrievalMode;
  temperature?: number;
  maxContextChunks?: number;
  modelProvider?: string;
  generationModel?: string;
  embeddingModel?: string;
};

export class AgentsRepository {
  async listAgentsForUser(userId: string): Promise<AgentRecord[]> {
    const result = await pool.query<AgentRecord>(
      `
        SELECT
          a.id,
          a.user_id AS "userId",
          a.name,
          a.description,
          a.public_agent_key AS "publicAgentKey",
          a.status,
          a.visibility,
          a.base_instructions AS "baseInstructions",
          a.welcome_message AS "welcomeMessage",
          a.fallback_message AS "fallbackMessage",
          a.retrieval_mode AS "retrievalMode",
          a.temperature::text AS "temperature",
          a.max_context_chunks AS "maxContextChunks",
          a.model_provider AS "modelProvider",
          a.generation_model AS "generationModel",
          a.embedding_model AS "embeddingModel",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          COUNT(DISTINCT d.id)::int AS "documentCount",
          COUNT(DISTINCT c.id)::int AS "conversationCount"
        FROM agents a
        LEFT JOIN documents d ON d.user_id = a.user_id AND d.agent_id = a.id::text
        LEFT JOIN conversations c ON c.user_id = a.user_id AND c.agent_id = a.id::text
        WHERE a.user_id = $1
          AND a.status <> 'archived'
        GROUP BY a.id
        ORDER BY a.updated_at DESC, a.created_at DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async findAgentForUser(userId: string, agentId: string): Promise<AgentRecord | null> {
    const result = await pool.query<AgentRecord>(
      `
        SELECT
          id,
          user_id AS "userId",
          name,
          description,
          public_agent_key AS "publicAgentKey",
          status,
          visibility,
          base_instructions AS "baseInstructions",
          welcome_message AS "welcomeMessage",
          fallback_message AS "fallbackMessage",
          retrieval_mode AS "retrievalMode",
          temperature::text AS "temperature",
          max_context_chunks AS "maxContextChunks",
          model_provider AS "modelProvider",
          generation_model AS "generationModel",
          embedding_model AS "embeddingModel",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
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

  async findAgentByPublicKey(agentKey: string): Promise<AgentRecord | null> {
    const result = await pool.query<AgentRecord>(
      `
        SELECT
          id,
          user_id AS "userId",
          name,
          description,
          public_agent_key AS "publicAgentKey",
          status,
          visibility,
          base_instructions AS "baseInstructions",
          welcome_message AS "welcomeMessage",
          fallback_message AS "fallbackMessage",
          retrieval_mode AS "retrievalMode",
          temperature::text AS "temperature",
          max_context_chunks AS "maxContextChunks",
          model_provider AS "modelProvider",
          generation_model AS "generationModel",
          embedding_model AS "embeddingModel",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM agents
        WHERE public_agent_key = $1
        LIMIT 1
      `,
      [agentKey],
    );

    return result.rows[0] ?? null;
  }

  async createAgentForUser(userId: string, input: AgentWriteInput): Promise<AgentRecord> {
    const result = await pool.query<AgentRecord>(
      `
        INSERT INTO agents (
          user_id,
          name,
          description,
          public_agent_key,
          status,
          visibility,
          base_instructions,
          welcome_message,
          fallback_message,
          retrieval_mode,
          temperature,
          max_context_chunks,
          model_provider,
          generation_model,
          embedding_model,
          greeting_message,
          system_prompt,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $8, $7, $5 = 'active')
        RETURNING
          id,
          user_id AS "userId",
          name,
          description,
          public_agent_key AS "publicAgentKey",
          status,
          visibility,
          base_instructions AS "baseInstructions",
          welcome_message AS "welcomeMessage",
          fallback_message AS "fallbackMessage",
          retrieval_mode AS "retrievalMode",
          temperature::text AS "temperature",
          max_context_chunks AS "maxContextChunks",
          model_provider AS "modelProvider",
          generation_model AS "generationModel",
          embedding_model AS "embeddingModel",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        userId,
        input.name,
        input.description ?? null,
        this.createPublicAgentKey(),
        input.status ?? "draft",
        input.visibility ?? "private",
        input.baseInstructions ?? "You are Echo, a helpful support assistant grounded in uploaded documents.",
        input.welcomeMessage ?? "Hi. Ask me anything about this product.",
        input.fallbackMessage ?? "I do not have enough information from the available support docs to answer that confidently.",
        input.retrievalMode ?? "auto",
        input.temperature ?? 0.2,
        input.maxContextChunks ?? 6,
        input.modelProvider ?? "bedrock",
        input.generationModel ?? env.DEFAULT_GENERATION_MODEL,
        input.embeddingModel ?? env.DEFAULT_EMBEDDING_MODEL,
      ],
    );

    return result.rows[0];
  }

  async updateAgentForUser(userId: string, agentId: string, input: Partial<AgentWriteInput>): Promise<AgentRecord | null> {
    const current = await this.findAgentForUser(userId, agentId);
    if (!current) {
      return null;
    }

    const result = await pool.query<AgentRecord>(
      `
        UPDATE agents
        SET
          name = $3,
          description = $4,
          status = $5,
          visibility = $6,
          base_instructions = $7,
          welcome_message = $8,
          fallback_message = $9,
          retrieval_mode = $10,
          temperature = $11,
          max_context_chunks = $12,
          model_provider = $13,
          generation_model = $14,
          embedding_model = $15,
          greeting_message = $8,
          system_prompt = $7,
          is_active = $5 = 'active',
          updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING
          id,
          user_id AS "userId",
          name,
          description,
          public_agent_key AS "publicAgentKey",
          status,
          visibility,
          base_instructions AS "baseInstructions",
          welcome_message AS "welcomeMessage",
          fallback_message AS "fallbackMessage",
          retrieval_mode AS "retrievalMode",
          temperature::text AS "temperature",
          max_context_chunks AS "maxContextChunks",
          model_provider AS "modelProvider",
          generation_model AS "generationModel",
          embedding_model AS "embeddingModel",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        agentId,
        userId,
        input.name ?? current.name,
        input.description ?? current.description,
        input.status ?? current.status,
        input.visibility ?? current.visibility,
        input.baseInstructions ?? current.baseInstructions,
        input.welcomeMessage ?? current.welcomeMessage,
        input.fallbackMessage ?? current.fallbackMessage,
        input.retrievalMode ?? current.retrievalMode,
        input.temperature ?? Number(current.temperature),
        input.maxContextChunks ?? current.maxContextChunks,
        input.modelProvider ?? current.modelProvider,
        input.generationModel ?? current.generationModel,
        input.embeddingModel ?? current.embeddingModel,
      ],
    );

    return result.rows[0] ?? null;
  }

  async archiveAgentForUser(userId: string, agentId: string): Promise<boolean> {
    const result = await pool.query(
      `
        UPDATE agents
        SET status = 'archived', is_active = FALSE, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status <> 'archived'
      `,
      [agentId, userId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async listAllowedDomainsForUser(userId: string, agentId: string): Promise<Array<{ id: string; domain: string }>> {
    const result = await pool.query<{ id: string; domain: string }>(
      `
        SELECT id, domain
        FROM allowed_domains
        WHERE user_id = $1 AND agent_id = $2
        ORDER BY domain ASC
      `,
      [userId, agentId],
    );

    return result.rows;
  }

  private createPublicAgentKey() {
    return `agent_pub_${randomBytes(12).toString("base64url")}`;
  }
}
