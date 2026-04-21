import { Router } from "express";
import { StreamStatus, chatRequestSchema } from "@echo/shared";
import { sendValidationError } from "../../../lib/http.js";
import { retrievalOrchestrator } from "../../../lib/retrieval.js";
import { resolveAgentScope } from "../../../lib/tenant-scope.js";
import { analyticsQueue } from "../../../lib/queues.js";

export const chatRouter = Router();

chatRouter.post("/", async (request, response) => {
  const parsed = chatRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(response, parsed.error.format());
  }

  const {
    query,
    threadId,
    companyId = "default-company",
    agentId = "default-agent",
    conversation = [],
  } = parsed.data;

  try {
    const scope = await resolveAgentScope(companyId, agentId);

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.write(`data: ${JSON.stringify({ status: StreamStatus.Initializing })}\n\n`);

    const result = await retrievalOrchestrator.run({
      query,
      companyId: scope.companyScope,
      agentId: scope.agentId,
      conversation,
    });

    if (result.expandedQueries.length > 1) {
      response.write(
        `data: ${JSON.stringify({
          status: StreamStatus.Expanding,
          queries: result.expandedQueries,
        })}\n\n`,
      );
    }

    response.write(
      `data: ${JSON.stringify({
        status: StreamStatus.Retrieved,
        docs: result.context.map((chunk) => ({
          content: `${chunk.content.substring(0, 80)}...`,
          score: chunk.score.toFixed(3),
        })),
      })}\n\n`,
    );

    response.write(
      `data: ${JSON.stringify({
        status: StreamStatus.Grading,
        passed: !result.shouldFallback,
      })}\n\n`,
    );

    response.write(`data: ${JSON.stringify({ status: StreamStatus.Generating })}\n\n`);

    let fullTextResponse = "";
    for (const token of result.answer.split(/(\s+)/)) {
      if (!token) {
        continue;
      }

      fullTextResponse += token;
      response.write(`data: ${JSON.stringify({ text: token })}\n\n`);
    }

    response.write(`data: ${JSON.stringify({ status: StreamStatus.Done })}\n\n`);
    response.write("data: [DONE]\n\n");

    void analyticsQueue.add("log-chat", {
      companyId: scope.companyScope,
      agentId: scope.agentId,
      conversationId: threadId,
      source: "PLAYGROUND",
      sessionId: threadId,
      query,
      response: fullTextResponse.trim(),
      strategy: result.strategy,
      confidence: result.confidence,
      fallbackUsed: result.shouldFallback,
    });

    response.end();
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({ error: "Internal server error during chat processing" });
      return;
    }

    response.end();
  }
});
