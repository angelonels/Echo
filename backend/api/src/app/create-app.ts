import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { apiRoutes } from "@echo/shared";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { authRouter } from "../modules/auth/routes/auth.routes.js";
import { agentsRouter } from "../modules/agents/routes/agents.routes.js";
import { healthRouter } from "../modules/health/routes/health.routes.js";
import { chatRouter } from "../modules/chat/routes/chat.routes.js";
import { analyticsRouter } from "../modules/analytics/routes/analytics.routes.js";
import { documentsRouter } from "../modules/documents/routes/documents.routes.js";
import { agentDocumentsRouter } from "../modules/documents/routes/agent-documents.routes.js";
import { playgroundChatRouter } from "../modules/chat/routes/playground.routes.js";
import { agentAnalyticsRouter } from "../modules/analytics/routes/agent-analytics.routes.js";
import { conversationsRouter } from "../modules/conversations/routes/conversations.routes.js";
import { widgetRouter } from "../modules/widget/routes/widget.routes.js";

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

  app.get("/api/v1/ready", (_request, response) => {
    response.json({
      status: "ready",
      service: "api",
    });
  });

  app.use(apiRoutes.health, healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/agents", agentsRouter);
  app.use("/api/v1/agents/:agentId/documents", agentDocumentsRouter);
  app.use("/api/v1/agents/:agentId/playground", playgroundChatRouter);
  app.use("/api/v1/agents/:agentId/analytics", agentAnalyticsRouter);
  app.use("/api/v1/agents/:agentId/conversations", conversationsRouter);
  app.use("/api/v1/widget", widgetRouter);
  app.use(apiRoutes.chat, chatRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/documents", documentsRouter);

  return app;
}
