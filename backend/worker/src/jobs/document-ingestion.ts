import { and, eq } from "drizzle-orm";
import { queueNames } from "@echo/shared";
import { createQueueWorker } from "../lib/queues.js";
import { DocumentIngestionService } from "../services/document-ingestion-service.js";

type IngestJob = {
  documentId: string;
  companyId: string;
  agentId: string;
};

const documentIngestionService = new DocumentIngestionService();

export const documentIngestionWorker = createQueueWorker(queueNames.documents, async (job) => {
  if (job.name !== "ingest-document") {
    return;
  }

  const { documentId, companyId, agentId } = job.data as IngestJob;
  await documentIngestionService.ingest({ documentId, companyId, agentId });
});
