import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { queueNames } from "@echo/shared";
import { env } from "../config/env.js";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const documentsQueue = new Queue(queueNames.documents, {
  connection: redisConnection,
});

export const analyticsQueue = new Queue(queueNames.analytics, {
  connection: redisConnection,
});

export const maintenanceQueue = new Queue(queueNames.maintenance, {
  connection: redisConnection,
});

export function createQueueWorker(name: string, processor: ConstructorParameters<typeof Worker>[1]) {
  return new Worker(name, processor, {
    connection: redisConnection,
  });
}
