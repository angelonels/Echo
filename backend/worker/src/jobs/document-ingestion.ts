import { and, eq } from "drizzle-orm";
import { queueNames } from "@echo/shared";
import { db } from "../lib/db.js";
import { documents, knowledgeChunks } from "../lib/schema.js";
import { EmbeddingService } from "../lib/embeddings.js";
import { createQueueWorker } from "../lib/queues.js";
import { logger } from "../lib/logger.js";
import { extractDocumentText } from "../lib/document-text-extractor.js";
import { chunkDocument } from "../lib/document-chunker.js";

const embeddings = new EmbeddingService();

type IngestJob = {
  documentId: string;
  companyId: string;
  agentId: string;
};

export const documentIngestionWorker = createQueueWorker(queueNames.documents, async (job) => {
  if (job.name !== "ingest-document") {
    return;
  }

  const { documentId, companyId, agentId } = job.data as IngestJob;

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.companyId, companyId), eq(documents.agentId, agentId)))
    .limit(1);

  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  await db
    .update(documents)
    .set({ status: "PROCESSING", processingError: null, updatedAt: new Date() })
    .where(eq(documents.id, documentId));

  try {
    const extractedText = await extractDocumentText(document.storagePath, document.mimeType);
    const chunks = await chunkDocument(extractedText);

    if (!chunks.length) {
      throw new Error("No extractable content found");
    }

    const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.content));

    await db.transaction(async (tx) => {
      await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.docId, documentId));

      await tx.insert(knowledgeChunks).values(
        chunks.map((chunk, index) => ({
          docId: documentId,
          companyId,
          agentId,
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
      );

      await tx
        .update(documents)
        .set({ status: "READY", processingError: null, updatedAt: new Date() })
        .where(eq(documents.id, documentId));
    });

    logger.info({ documentId, companyId, agentId, chunkCount: chunks.length }, "Completed document ingestion");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion failure";

    await db
      .update(documents)
      .set({ status: "FAILED", processingError: message, updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    logger.error({ error, documentId, companyId, agentId }, "Document ingestion failed");
    throw error;
  }
});
