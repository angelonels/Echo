import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { queueNames } from "@echo/shared";
import { env } from "../config/env.js";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const analyticsQueue = new Queue(queueNames.analytics, {
  connection: redisConnection,
});

export const maintenanceQueue = new Queue(queueNames.maintenance, {
  connection: redisConnection,
});
