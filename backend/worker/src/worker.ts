import { pool } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { documentsQueue, redisConnection } from "./lib/queues.js";
import "./jobs/document-ingestion.js";

async function start() {
  logger.info("Worker started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down worker");
    await documentsQueue.close();
    await redisConnection.quit();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
