import { pool } from "../../lib/db.js";

export type PersistRetrievalTraceInput = {
  userId: string;
  agentId: string;
  conversationId: string;
  messageId: string;
  channel: "playground" | "widget" | "internal_eval";
  userQuestion: string;
  normalizedQuestion: string;
  detectedIntent: string;
  retrievalStrategy: string;
  retrievedChunks: unknown[];
  selectedChunks: unknown[];
  modelProvider: string;
  generationModel: string;
  embeddingModel: string;
  responseType: string;
  confidence: number;
  confidenceComponents: Record<string, number>;
  citations: unknown[];
  latencyMs: number;
  warnings: string[];
};

export class TracesRepository {
  async listTracesForAgent(userId: string, agentId: string) {
    const result = await pool.query(
      `
        SELECT
          id,
          conversation_id AS "conversationId",
          message_id AS "messageId",
          channel,
          user_question AS "userQuestion",
          retrieval_strategy AS "retrievalStrategy",
          response_type AS "responseType",
          confidence::float AS confidence,
          latency_ms AS "latencyMs",
          warnings,
          created_at AS "createdAt"
        FROM retrieval_traces
        WHERE user_id = $1 AND agent_id = $2 AND channel <> 'internal_eval'
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [userId, agentId],
    );

    return result.rows;
  }

  async getTraceForAgent(userId: string, agentId: string, traceId: string) {
    const result = await pool.query(
      `
        SELECT
          id,
          conversation_id AS "conversationId",
          message_id AS "messageId",
          channel,
          user_question AS "userQuestion",
          normalized_question AS "normalizedQuestion",
          detected_intent AS "detectedIntent",
          retrieval_strategy AS "retrievalStrategy",
          retrieved_chunks AS "retrievedChunks",
          selected_chunks AS "selectedChunks",
          prompt_version AS "promptVersion",
          model_provider AS "modelProvider",
          generation_model AS "generationModel",
          embedding_model AS "embeddingModel",
          response_type AS "responseType",
          confidence::float AS confidence,
          confidence_components AS "confidenceComponents",
          groundedness_score::float AS "groundednessScore",
          citations,
          latency_ms AS "latencyMs",
          token_usage AS "tokenUsage",
          estimated_cost_usd::float AS "estimatedCostUsd",
          warnings,
          error_code AS "errorCode",
          error_message AS "errorMessage",
          created_at AS "createdAt"
        FROM retrieval_traces
        WHERE id = $1 AND user_id = $2 AND agent_id = $3 AND channel <> 'internal_eval'
        LIMIT 1
      `,
      [traceId, userId, agentId],
    );

    return result.rows[0] ?? null;
  }

  async persistRetrievalTrace(input: PersistRetrievalTraceInput): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `
        INSERT INTO retrieval_traces (
          user_id,
          agent_id,
          conversation_id,
          message_id,
          channel,
          user_question,
          normalized_question,
          detected_intent,
          retrieval_strategy,
          retrieved_chunks,
          selected_chunks,
          prompt_version,
          model_provider,
          generation_model,
          embedding_model,
          response_type,
          confidence,
          confidence_components,
          citations,
          latency_ms,
          warnings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, 'phase3-rag-v1', $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb, $19, $20::jsonb)
        RETURNING id
      `,
      [
        input.userId,
        input.agentId,
        input.conversationId,
        input.messageId,
        input.channel,
        input.userQuestion,
        input.normalizedQuestion,
        input.detectedIntent,
        input.retrievalStrategy,
        JSON.stringify(input.retrievedChunks),
        JSON.stringify(input.selectedChunks),
        input.modelProvider,
        input.generationModel,
        input.embeddingModel,
        input.responseType,
        input.confidence,
        JSON.stringify(input.confidenceComponents),
        JSON.stringify(input.citations),
        input.latencyMs,
        JSON.stringify(input.warnings),
      ],
    );

    return result.rows[0].id;
  }
}
