import { Queue } from "bullmq";
import { Redis } from "ioredis";
import {
  defaultJobOptions,
  ingestDocumentJobSchema,
  queueJobNames,
  queueNames,
  type IngestDocumentJob,
} from "@echo/shared";
import { env } from "../config/env.js";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const documentsQueue = new Queue(queueNames.documents, {
  connection: redisConnection,
});

export async function enqueueDocumentIngestion(payload: IngestDocumentJob) {
  return documentsQueue.add(queueJobNames.ingestDocument, ingestDocumentJobSchema.parse(payload), defaultJobOptions.ingestion);
}
