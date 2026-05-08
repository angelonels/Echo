import { pool } from "../../lib/db.js";

export type DocumentStatus = "uploaded" | "extracting" | "chunking" | "embedding" | "indexing" | "ready" | "failed";

export type DocumentRecord = {
  id: string;
  userId: string;
  agentId: string;
  originalFilename: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  processingError: string | null;
  storagePath: string;
  currentVersionId: string | null;
  versionNumber: number | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateDocumentInput = {
  userId: string;
  agentId: string;
  originalFilename: string;
  displayName: string;
  mimeType: string;
  storagePath: string;
  sizeBytes: number;
  contentHash: string;
  embeddingModel: string;
};

export class DocumentsRepository {
  async assertAgentForUser(userId: string, agentId: string): Promise<boolean> {
    const result = await pool.query(`SELECT 1 FROM agents WHERE id = $1 AND user_id = $2 AND status <> 'archived'`, [
      agentId,
      userId,
    ]);
    return Boolean(result.rowCount);
  }

  async countDocumentsForAgent(userId: string, agentId: string): Promise<number> {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM documents WHERE user_id = $1 AND agent_id = $2`,
      [userId, agentId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async findDuplicateContentHash(userId: string, agentId: string, contentHash: string): Promise<DocumentRecord | null> {
    const result = await pool.query<DocumentRecord>(
      `
        SELECT
          d.id,
          d.user_id AS "userId",
          d.agent_id AS "agentId",
          d.filename AS "originalFilename",
          d.filename AS "displayName",
          d.mime_type AS "mimeType",
          d.size_bytes AS "sizeBytes",
          d.status,
          d.processing_error AS "processingError",
          d.storage_path AS "storagePath",
          d.current_version_id AS "currentVersionId",
          v.version_number AS "versionNumber",
          COALESCE(v.chunk_count, 0)::int AS "chunkCount",
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt"
        FROM documents d
        JOIN document_versions v ON v.id = d.current_version_id
        WHERE d.user_id = $1
          AND d.agent_id = $2
          AND v.content_hash = $3
        LIMIT 1
      `,
      [userId, agentId, contentHash],
    );
    return result.rows[0] ?? null;
  }

  async listDocuments(userId: string, agentId: string): Promise<DocumentRecord[]> {
    const result = await pool.query<DocumentRecord>(
      `
        SELECT
          d.id,
          d.user_id AS "userId",
          d.agent_id AS "agentId",
          d.filename AS "originalFilename",
          d.filename AS "displayName",
          d.mime_type AS "mimeType",
          d.size_bytes AS "sizeBytes",
          d.status,
          d.processing_error AS "processingError",
          d.storage_path AS "storagePath",
          d.current_version_id AS "currentVersionId",
          v.version_number AS "versionNumber",
          COALESCE(v.chunk_count, 0)::int AS "chunkCount",
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt"
        FROM documents d
        LEFT JOIN document_versions v ON v.id = d.current_version_id
        WHERE d.user_id = $1
          AND d.agent_id = $2
        ORDER BY d.created_at DESC
      `,
      [userId, agentId],
    );

    return result.rows;
  }

  async findDocument(userId: string, agentId: string, documentId: string): Promise<DocumentRecord | null> {
    const result = await pool.query<DocumentRecord>(
      `
        SELECT
          d.id,
          d.user_id AS "userId",
          d.agent_id AS "agentId",
          d.filename AS "originalFilename",
          d.filename AS "displayName",
          d.mime_type AS "mimeType",
          d.size_bytes AS "sizeBytes",
          d.status,
          d.processing_error AS "processingError",
          d.storage_path AS "storagePath",
          d.current_version_id AS "currentVersionId",
          v.version_number AS "versionNumber",
          COALESCE(v.chunk_count, 0)::int AS "chunkCount",
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt"
        FROM documents d
        LEFT JOIN document_versions v ON v.id = d.current_version_id
        WHERE d.id = $1
          AND d.user_id = $2
          AND d.agent_id = $3
        LIMIT 1
      `,
      [documentId, userId, agentId],
    );

    return result.rows[0] ?? null;
  }

  async createDocumentWithVersion(input: CreateDocumentInput): Promise<DocumentRecord> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const documentResult = await client.query<{ id: string }>(
        `
          INSERT INTO documents (
            user_id,
            company_id,
            agent_id,
            filename,
            mime_type,
            storage_path,
            size_bytes,
            status,
            processing_error
          )
          VALUES ($1, $1, $2, $3, $4, $5, $6, 'uploaded', NULL)
          RETURNING id
        `,
        [
          input.userId,
          input.agentId,
          input.originalFilename,
          input.mimeType,
          input.storagePath,
          input.sizeBytes,
        ],
      );
      const documentId = documentResult.rows[0].id;
      const versionResult = await client.query<{ id: string }>(
        `
          INSERT INTO document_versions (
            user_id,
            agent_id,
            document_id,
            version_number,
            file_path,
            content_hash,
            extraction_status,
            embedding_model
          )
          VALUES ($1, $2, $3, 1, $4, $5, 'pending', $6)
          RETURNING id
        `,
        [input.userId, input.agentId, documentId, input.storagePath, input.contentHash, input.embeddingModel],
      );
      const versionId = versionResult.rows[0].id;
      await client.query(`UPDATE documents SET current_version_id = $1, updated_at = NOW() WHERE id = $2`, [
        versionId,
        documentId,
      ]);
      await client.query("COMMIT");
      const created = await this.findDocument(input.userId, input.agentId, documentId);
      if (!created) {
        throw new Error("Created document could not be loaded.");
      }
      return created;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createNextVersion(input: CreateDocumentInput & { documentId: string }): Promise<DocumentRecord | null> {
    const result = await pool.query<{ versionId: string }>(
      `
        WITH next_version AS (
          SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number
          FROM document_versions
          WHERE document_id = $3
        ),
        inserted AS (
          INSERT INTO document_versions (
            user_id,
            agent_id,
            document_id,
            version_number,
            file_path,
            content_hash,
            extraction_status,
            embedding_model
          )
          SELECT $1, $2, $3, version_number, $4, $5, 'pending', $6
          FROM next_version
          RETURNING id
        )
        UPDATE documents
        SET
          status = 'uploaded',
          processing_error = NULL,
          updated_at = NOW()
        WHERE id = $3
          AND user_id = $1
          AND agent_id = $2
        RETURNING current_version_id AS "versionId"
      `,
      [
        input.userId,
        input.agentId,
        input.documentId,
        input.storagePath,
        input.contentHash,
        input.embeddingModel,
      ],
    );

    if (!result.rowCount) {
      return null;
    }

    return this.findDocument(input.userId, input.agentId, input.documentId);
  }

  async deleteDocument(userId: string, agentId: string, documentId: string) {
    const result = await pool.query(`DELETE FROM documents WHERE id = $1 AND user_id = $2 AND agent_id = $3`, [
      documentId,
      userId,
      agentId,
    ]);
    return Boolean(result.rowCount);
  }

  async findLatestPendingVersionId(userId: string, agentId: string, documentId: string): Promise<string | null> {
    const result = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM document_versions
        WHERE user_id = $1
          AND agent_id = $2
          AND document_id = $3
          AND extraction_status = 'pending'
        ORDER BY version_number DESC
        LIMIT 1
      `,
      [userId, agentId, documentId],
    );

    return result.rows[0]?.id ?? null;
  }
}
