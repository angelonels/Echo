import { z } from "zod";

export const queueJobNames = {
  ingestDocument: "ingest-document",
  detectKnowledgeGap: "detect-knowledge-gap",
} as const;

export const ingestDocumentJobSchema = z.object({
  userId: z.string().uuid(),
  agentId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentVersionId: z.string().uuid(),
});

export const detectKnowledgeGapJobSchema = z.object({
  userId: z.string().uuid(),
  agentId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  traceId: z.string().uuid().optional(),
});

export type IngestDocumentJob = z.infer<typeof ingestDocumentJobSchema>;
export type DetectKnowledgeGapJob = z.infer<typeof detectKnowledgeGapJobSchema>;

export const defaultJobOptions = {
  ingestion: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 20,
    removeOnFail: 20,
  },
  analytics: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
  maintenance: {
    removeOnComplete: 10,
    removeOnFail: 10,
  },
} as const;
