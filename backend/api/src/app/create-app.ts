import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { apiRoutes } from "@echo/shared";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { healthRouter } from "../modules/health/routes/health.routes.js";
import { chatRouter } from "../modules/chat/routes/chat.routes.js";
import { analyticsRouter } from "../modules/analytics/routes/analytics.routes.js";
import { documentsRouter } from "../modules/documents/routes/documents.routes.js";

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/", (_request, response) => {
    response.json({
      service: "echo-api",
      health: apiRoutes.health,
    });
  });

  app.use(apiRoutes.health, healthRouter);
  app.use(apiRoutes.chat, chatRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/documents", documentsRouter);

  return app;
}
