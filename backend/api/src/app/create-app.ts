import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { apiRoutes } from "@echo/shared";
import { env } from "../config/env.js";
import { requireAuth } from "../lib/auth.js";
import { errorMiddleware } from "../lib/http.js";
import { logger } from "../lib/logger.js";
import { authRouter } from "../modules/auth/routes/auth.routes.js";
import { agentsRouter } from "../modules/agents/routes/agents.routes.js";
import { allowedDomainsRouter } from "../modules/allowed-domains/routes/allowed-domains.routes.js";
import { healthRouter } from "../modules/health/routes/health.routes.js";
import { agentDocumentsRouter } from "../modules/documents/routes/agent-documents.routes.js";
import { playgroundChatRouter } from "../modules/chat/routes/playground.routes.js";
import { agentAnalyticsRouter } from "../modules/analytics/routes/agent-analytics.routes.js";
import { conversationsRouter } from "../modules/conversations/routes/conversations.routes.js";
import { knowledgeGapsRouter } from "../modules/knowledge-gaps/routes/knowledge-gaps.routes.js";
import { tracesRouter } from "../modules/traces/routes/traces.routes.js";
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

  app.get("/api/v1/me", requireAuth, (request, response) => {
    response.json({
      id: request.auth?.userId,
      email: request.auth?.email,
      name: request.auth?.name,
      imageUrl: request.auth?.imageUrl,
    });
  });

  app.use(apiRoutes.health, healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/agents", requireAuth, agentsRouter);
  app.use("/api/v1/agents/:agentId/allowed-domains", requireAuth, allowedDomainsRouter);
  app.use("/api/v1/agents/:agentId/documents", requireAuth, agentDocumentsRouter);
  app.use("/api/v1/agents/:agentId/playground", requireAuth, playgroundChatRouter);
  app.use("/api/v1/agents/:agentId/analytics", requireAuth, agentAnalyticsRouter);
  app.use("/api/v1/agents/:agentId/conversations", requireAuth, conversationsRouter);
  app.use("/api/v1/agents/:agentId/traces", requireAuth, tracesRouter);
  app.use("/api/v1/agents/:agentId/knowledge-gaps", requireAuth, knowledgeGapsRouter);
  app.use("/api/v1/widget", widgetRouter);

  app.use(errorMiddleware);

  return app;
}
