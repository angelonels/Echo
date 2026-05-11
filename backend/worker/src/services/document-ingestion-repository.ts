import { createHash } from "node:crypto";
import { pool } from "../lib/db.js";

export type IngestibleDocument = {
  id: string;
  userId: string;
  agentId: string;
  documentVersionId: string;
  filename: string;
  mimeType: string;
  storagePath: string;
  embeddingModel: string;
};

export type PersistedKnowledgeChunk = {
  documentId: string;
  userId: string;
  agentId: string;
  documentVersionId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
};

export class DocumentIngestionRepository {
  async findDocument(input: {
    documentId: string;
    userId: string;
    agentId: string;
    documentVersionId: string;
  }): Promise<IngestibleDocument | null> {
    const result = await pool.query<IngestibleDocument>(
      `
        SELECT
          d.id,
          d.user_id AS "userId",
          d.agent_id AS "agentId",
          v.id AS "documentVersionId",
          d.filename,
          d.mime_type AS "mimeType",
          v.file_path AS "storagePath",
          v.embedding_model AS "embeddingModel"
        FROM documents d
        JOIN document_versions v ON v.document_id = d.id
        WHERE d.id = $1
          AND d.user_id = $2
          AND d.agent_id = $3
          AND v.id = $4
        LIMIT 1
      `,
      [input.documentId, input.userId, input.agentId, input.documentVersionId],
    );

    return result.rows[0] ?? null;
  }

  async markStage(input: {
    documentId: string;
    documentVersionId: string;
    userId: string;
    agentId: string;
    stage: "extracting" | "chunking" | "embedding" | "indexing";
  }) {
    await pool.query(
      `
        UPDATE document_versions
        SET extraction_status = $5, processing_error = NULL
        WHERE id = $1 AND document_id = $2 AND user_id = $3 AND agent_id = $4
      `,
      [input.documentVersionId, input.documentId, input.userId, input.agentId, input.stage],
    );
    await pool.query(
      `
        UPDATE documents
        SET status = $4, processing_error = NULL, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND agent_id = $3
      `,
      [input.documentId, input.userId, input.agentId, input.stage],
    );
  }

  async replaceChunksAndMarkReady(input: {
    documentId: string;
    documentVersionId: string;
    userId: string;
    agentId: string;
    extractedText: string;
    chunks: PersistedKnowledgeChunk[];
  }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM knowledge_chunks WHERE document_version_id = $1 AND user_id = $2 AND agent_id = $3`,
        [input.documentVersionId, input.userId, input.agentId],
      );

      for (const chunk of input.chunks) {
        const metadata = chunk.metadata ?? {};
        await client.query(
          `
            INSERT INTO knowledge_chunks (
              doc_id,
              user_id,
              company_id,
              agent_id,
              document_version_id,
              chunk_index,
              content,
              content_hash,
              token_count,
              page_number,
              section_title,
              embedding,
              metadata
            )
            VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::vector, $12)
          `,
          [
            chunk.documentId,
            chunk.userId,
            chunk.agentId,
            chunk.documentVersionId,
            String(chunk.chunkIndex),
            chunk.content,
            createHash("sha256").update(chunk.content).digest("hex"),
            estimateTokenCount(chunk.content),
            typeof metadata.pageNumber === "number" ? metadata.pageNumber : null,
            typeof metadata.sectionTitle === "string" ? metadata.sectionTitle : null,
            `[${chunk.embedding.join(",")}]`,
            JSON.stringify(metadata),
          ],
        );
      }

      const extractedHash = createHash("sha256").update(input.extractedText).digest("hex");
      await client.query(
        `
          UPDATE document_versions
          SET
            extraction_status = 'ready',
            processing_error = NULL,
            extracted_text = $5,
            extracted_text_hash = $6,
            chunk_count = $7,
            processed_at = NOW()
          WHERE id = $1 AND document_id = $2 AND user_id = $3 AND agent_id = $4
        `,
        [
          input.documentVersionId,
          input.documentId,
          input.userId,
          input.agentId,
          input.extractedText,
          extractedHash,
          input.chunks.length,
        ],
      );
      await client.query(
        `
          UPDATE documents
          SET status = 'ready', processing_error = NULL, current_version_id = $4, updated_at = NOW()
          WHERE id = $1 AND user_id = $2 AND agent_id = $3
        `,
        [input.documentId, input.userId, input.agentId, input.documentVersionId],
      );
      await client.query(
        `
          DELETE FROM knowledge_chunks
          WHERE doc_id = $1
            AND user_id = $2
            AND agent_id = $3
            AND document_version_id <> $4
        `,
        [input.documentId, input.userId, input.agentId, input.documentVersionId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markFailed(input: {
    documentId: string;
    documentVersionId: string;
    userId: string;
    agentId: string;
    message: string;
  }) {
    await pool.query(
      `
        UPDATE document_versions
        SET extraction_status = 'failed', processing_error = $5
        WHERE id = $1 AND document_id = $2 AND user_id = $3 AND agent_id = $4
      `,
      [input.documentVersionId, input.documentId, input.userId, input.agentId, input.message],
    );
      await pool.query(
      `
        UPDATE documents
        SET
          status = CASE WHEN current_version_id IS NULL OR current_version_id = $5 THEN 'failed' ELSE 'ready' END,
          processing_error = $4,
          updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND agent_id = $3
      `,
      [input.documentId, input.userId, input.agentId, input.message, input.documentVersionId],
    );
  }
}

function estimateTokenCount(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length * 1.33));
}
