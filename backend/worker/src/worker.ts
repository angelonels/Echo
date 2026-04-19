import { pool } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { maintenanceQueue, redisConnection } from "./lib/queues.js";
import "./jobs/chat-analytics.js";
import "./jobs/map-reduce.js";

async function registerRepeatableJobs() {
  await maintenanceQueue.add(
    "reduce-daily-insights",
    {},
    {
      repeat: { pattern: "0 0 * * *" },
      jobId: "reduce-daily-insights",
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  );

  await maintenanceQueue.add(
    "map-hourly-logs",
    {},
    {
      repeat: { pattern: "0 * * * *" },
      jobId: "map-hourly-logs",
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  );
}

async function start() {
  await registerRepeatableJobs();
  logger.info("Worker started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down worker");
    await maintenanceQueue.close();
    await redisConnection.quit();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
