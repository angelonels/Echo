import { eq, sql } from "drizzle-orm";
import { db } from "../../../lib/db.js";
import { knowledgeChunks } from "../../../lib/schema.js";
import type {
  HybridSearchParams,
  PersistChunkParams,
  VectorSearchRepository,
} from "../interfaces/VectorSearchRepository.js";
import type { RetrievedChunk } from "../types/retrieval.js";

export class PostgresVectorSearchRepository implements VectorSearchRepository {
  async hybridSearch(params: HybridSearchParams): Promise<RetrievedChunk[]> {
    const embeddingString = `[${params.embedding.join(",")}]`;

    const rawQuery = sql`
      WITH vector_search AS (
        SELECT
          id,
          doc_id,
          company_id,
          agent_id,
          content,
          metadata,
          chunk_index,
          GREATEST(0.0, 1 - (embedding <=> ${embeddingString}::vector)) AS semantic_score,
          ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingString}::vector) AS semantic_rank
        FROM knowledge_chunks
        WHERE company_id = ${params.companyId}
          AND agent_id = ${params.agentId}
        LIMIT ${Math.max(params.limit * 3, 12)}
      ),
      keyword_search AS (
        SELECT
          id,
          ts_rank(search_vector, plainto_tsquery('english', ${params.query})) AS lexical_score,
          ROW_NUMBER() OVER (
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${params.query})) DESC
          ) AS lexical_rank
        FROM knowledge_chunks
        WHERE company_id = ${params.companyId}
          AND agent_id = ${params.agentId}
          AND search_vector @@ plainto_tsquery('english', ${params.query})
        LIMIT ${Math.max(params.limit * 3, 12)}
      )
      SELECT
        v.id AS chunk_id,
        v.doc_id AS document_id,
        v.company_id,
        v.agent_id,
        v.content,
        v.metadata,
        COALESCE(k.lexical_score, 0.0) AS lexical_score,
        v.semantic_score,
        (
          LEAST(1.0, v.semantic_score) * 0.65 +
          LEAST(1.0, COALESCE(k.lexical_score, 0.0)) * 0.35
        ) AS combined_score,
        ROW_NUMBER() OVER (
          ORDER BY (
            LEAST(1.0, v.semantic_score) * 0.65 +
            LEAST(1.0, COALESCE(k.lexical_score, 0.0)) * 0.35
          ) DESC
        ) AS rank
      FROM vector_search v
      LEFT JOIN keyword_search k ON v.id = k.id
      ORDER BY combined_score DESC
      LIMIT ${params.limit};
    `;

    const results = await db.execute(rawQuery);
    return results.rows.map((row: Record<string, unknown>) => ({
      chunkId: String(row.chunk_id),
      documentId: String(row.document_id),
      companyId: String(row.company_id),
      agentId: String(row.agent_id),
      content: String(row.content),
      lexicalScore: Number(row.lexical_score ?? 0),
      semanticScore: Number(row.semantic_score ?? 0),
      combinedScore: Number(row.combined_score ?? 0),
      rank: Number(row.rank ?? 0),
      metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    }));
  }

  async replaceDocumentChunks(documentId: string, chunks: PersistChunkParams[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.docId, documentId));

      if (chunks.length === 0) {
        return;
      }

      await tx.insert(knowledgeChunks).values(
        chunks.map((chunk) => ({
          docId: chunk.documentId,
          companyId: chunk.companyId,
          agentId: chunk.agentId,
          chunkIndex: String(chunk.chunkIndex),
          content: chunk.content,
          embedding: chunk.embedding,
          metadata: chunk.metadata ?? {},
        })),
      );
    });
  }
}
