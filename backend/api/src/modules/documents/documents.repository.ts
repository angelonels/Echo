import { pool } from "../../lib/db.js"

export type DocumentRecord = {
  id: string
  agentId: string
  companyId: string
  filename: string
  mimeType: string
  sizeBytes: number
  status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED"
  processingError: string | null
  storagePath: string
  createdAt: string
  updatedAt: string
}

export class DocumentsRepository {
  async findAgentScope(agentId: string): Promise<{ agentId: string; companyId: string } | null> {
    const result = await pool.query<{ agentId: string; companyId: string }>(
      `
        SELECT a.id AS "agentId", o.slug AS "companyId"
        FROM agents a
        JOIN organizations o ON o.id = a.org_id
        WHERE a.id = $1
        LIMIT 1
      `,
      [agentId],
    )

    return result.rows[0] ?? null
  }

  async listDocuments(agentId: string): Promise<DocumentRecord[]> {
    const result = await pool.query<DocumentRecord>(
      `
        SELECT
          id,
          agent_id AS "agentId",
          company_id AS "companyId",
          filename,
          mime_type AS "mimeType",
          size_bytes AS "sizeBytes",
          status,
          processing_error AS "processingError",
          storage_path AS "storagePath",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM documents
        WHERE agent_id = $1
        ORDER BY created_at DESC
      `,
      [agentId],
    )

    return result.rows
  }

  async findDocument(agentId: string, documentId: string): Promise<DocumentRecord | null> {
    const result = await pool.query<DocumentRecord>(
      `
        SELECT
          id,
          agent_id AS "agentId",
          company_id AS "companyId",
          filename,
          mime_type AS "mimeType",
          size_bytes AS "sizeBytes",
          status,
          processing_error AS "processingError",
          storage_path AS "storagePath",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM documents
        WHERE id = $1 AND agent_id = $2
        LIMIT 1
      `,
      [documentId, agentId],
    )

    return result.rows[0] ?? null
  }

  async createDocument(input: {
    agentId: string
    companyId: string
    filename: string
    mimeType: string
    storagePath: string
    sizeBytes: number
  }): Promise<DocumentRecord> {
    const result = await pool.query<DocumentRecord>(
      `
        INSERT INTO documents (
          company_id,
          agent_id,
          filename,
          mime_type,
          storage_path,
          size_bytes,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'UPLOADED')
        RETURNING
          id,
          agent_id AS "agentId",
          company_id AS "companyId",
          filename,
          mime_type AS "mimeType",
          size_bytes AS "sizeBytes",
          status,
          processing_error AS "processingError",
          storage_path AS "storagePath",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [input.companyId, input.agentId, input.filename, input.mimeType, input.storagePath, input.sizeBytes],
    )

    return result.rows[0]
  }

  async deleteDocument(agentId: string, documentId: string) {
    await pool.query(`DELETE FROM documents WHERE id = $1 AND agent_id = $2`, [documentId, agentId])
  }
}
