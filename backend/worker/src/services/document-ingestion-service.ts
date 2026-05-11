import { EmbeddingService } from "../lib/embeddings.js"
import { env } from "../config/env.js"
import { logger } from "../lib/logger.js"
import { DocumentTextExtractor } from "../lib/document-text-extractor.js"
import { DocumentChunker } from "../lib/document-chunker.js"
import { DocumentIngestionRepository } from "./document-ingestion-repository.js"

export class DocumentIngestionService {
  constructor(
    private readonly ingestionRepository = new DocumentIngestionRepository(),
    private readonly embeddingService = new EmbeddingService(),
    private readonly textExtractor = new DocumentTextExtractor(),
    private readonly documentChunker = new DocumentChunker(),
  ) {}

  async ingest(input: { documentId: string; userId: string; agentId: string; documentVersionId: string }) {
    const document = await this.ingestionRepository.findDocument(input)
    if (!document) {
      throw new Error(`Document ${input.documentId} not found`)
    }

    try {
      await this.ingestionRepository.markStage({ ...input, stage: "extracting" })
      const extractedText = await this.textExtractor.extract(document.storagePath, document.mimeType)
      const boundedText = extractedText.slice(0, env.MAX_EXTRACTED_CHARACTERS)

      await this.ingestionRepository.markStage({ ...input, stage: "chunking" })
      const chunks = (await this.documentChunker.chunk(boundedText)).slice(0, env.MAX_CHUNKS_PER_DOCUMENT)

      if (!chunks.length) {
        throw new Error("No extractable content found")
      }

      await this.ingestionRepository.markStage({ ...input, stage: "embedding" })
      const vectors = await this.embeddingService.embedDocuments(chunks.map((chunk) => chunk.content))

      await this.ingestionRepository.markStage({ ...input, stage: "indexing" })
      await this.ingestionRepository.replaceChunksAndMarkReady({
        ...input,
        extractedText: boundedText,
        chunks: chunks.map((chunk, index) => ({
          documentId: input.documentId,
          userId: input.userId,
          agentId: input.agentId,
          documentVersionId: input.documentVersionId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          embedding: vectors[index] ?? [],
          metadata: {
            ...chunk.metadata,
            filename: document.filename,
            mimeType: document.mimeType,
            totalChunks: chunks.length,
          },
        })),
      })

      logger.info(
        { documentId: input.documentId, userId: input.userId, agentId: input.agentId, chunkCount: chunks.length },
        "Completed document ingestion",
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown ingestion failure"

      await this.ingestionRepository.markFailed({ ...input, message })

      logger.error({ error, ...input }, "Document ingestion failed")
      throw error
    }
  }
}
