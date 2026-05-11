import { and, eq } from "drizzle-orm";
import { ingestDocumentJobSchema, queueJobNames, queueNames } from "@echo/shared";
import { createQueueWorker } from "../lib/queues.js";
import { DocumentIngestionService } from "../services/document-ingestion-service.js";

const documentIngestionService = new DocumentIngestionService();

export const documentIngestionWorker = createQueueWorker(queueNames.documents, async (job) => {
  if (job.name !== queueJobNames.ingestDocument) {
    return;
  }

  const { documentId, userId, agentId, documentVersionId } = ingestDocumentJobSchema.parse(job.data);
  await documentIngestionService.ingest({ documentId, userId, agentId, documentVersionId });
});
