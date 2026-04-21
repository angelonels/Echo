import { and, eq } from "drizzle-orm"
import { db } from "../lib/db.js"
import { documents, knowledgeChunks } from "../lib/schema.js"
import { EmbeddingService } from "../lib/embeddings.js"
import { logger } from "../lib/logger.js"
import { DocumentTextExtractor } from "../lib/document-text-extractor.js"
import { DocumentChunker } from "../lib/document-chunker.js"

export class DocumentIngestionService {
  constructor(
    private readonly embeddingService = new EmbeddingService(),
    private readonly textExtractor = new DocumentTextExtractor(),
    private readonly documentChunker = new DocumentChunker(),
  ) {}

  async ingest(input: { documentId: string; companyId: string; agentId: string }) {
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, input.documentId),
          eq(documents.companyId, input.companyId),
          eq(documents.agentId, input.agentId),
        ),
      )
      .limit(1)

    if (!document) {
      throw new Error(`Document ${input.documentId} not found`)
    }

    await db
      .update(documents)
      .set({ status: "PROCESSING", processingError: null, updatedAt: new Date() })
      .where(eq(documents.id, input.documentId))

    try {
      const extractedText = await this.textExtractor.extract(document.storagePath, document.mimeType)
      const chunks = await this.documentChunker.chunk(extractedText)

      if (!chunks.length) {
        throw new Error("No extractable content found")
      }

      const vectors = await this.embeddingService.embedDocuments(chunks.map((chunk) => chunk.content))

      await db.transaction(async (tx) => {
        await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.docId, input.documentId))

        await tx.insert(knowledgeChunks).values(
          chunks.map((chunk, index) => ({
            docId: input.documentId,
            companyId: input.companyId,
            agentId: input.agentId,
            chunkIndex: String(chunk.chunkIndex),
            content: chunk.content,
            embedding: vectors[index] ?? [],
            metadata: {
              ...chunk.metadata,
              filename: document.filename,
              mimeType: document.mimeType,
              totalChunks: chunks.length,
            },
          })),
        )

        await tx
          .update(documents)
          .set({ status: "READY", processingError: null, updatedAt: new Date() })
          .where(eq(documents.id, input.documentId))
      })

      logger.info(
        { documentId: input.documentId, companyId: input.companyId, agentId: input.agentId, chunkCount: chunks.length },
        "Completed document ingestion",
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown ingestion failure"

      await db
        .update(documents)
        .set({ status: "FAILED", processingError: message, updatedAt: new Date() })
        .where(eq(documents.id, input.documentId))

      logger.error({ error, ...input }, "Document ingestion failed")
      throw error
    }
  }
}
