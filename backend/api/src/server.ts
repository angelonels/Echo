import { createApp } from "./app/create-app.js";
import { env } from "./config/env.js";
import { initDb, pool } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { redisConnection } from "./lib/queues.js";
import { ensureUploadRoot } from "./lib/uploads.js";

const app = createApp();

async function start() {
  await ensureUploadRoot();
  await initDb();

  const server = app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, "API listening");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down API");
    server.close(async () => {
      await pool.end();
      await redisConnection.quit();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
