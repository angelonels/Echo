import { Router } from "express";
import { StreamStatus, chatRequestSchema } from "@echo/shared";
import { sendValidationError } from "../../../lib/http.js";
import { agentWorkflow, chatModel } from "../../../lib/agent.js";
import { analyticsQueue } from "../../../lib/queues.js";

export const chatRouter = Router();

chatRouter.post("/", async (request, response) => {
  const parsed = chatRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return sendValidationError(response, parsed.error.format());
  }

  const { query, threadId } = parsed.data;

  try {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.write(`data: ${JSON.stringify({ status: StreamStatus.Initializing })}\n\n`);

    const stream = await agentWorkflow.stream(
      {
        originalQuery: query,
        messages: [{ role: "user", content: query } as any],
      },
      { configurable: { thread_id: threadId } },
    );

    let finalState: any = null;
    let fallbackTriggered = false;
    let loopCount = 0;

    for await (const chunk of stream) {
      if (chunk.expand) {
        loopCount += 1;
        response.write(`data: ${JSON.stringify({ status: StreamStatus.Expanding, queries: chunk.expand.searchQueries })}\n\n`);
      }

      if (chunk.retrieve) {
        const docs = chunk.retrieve.retrievedDocs.map((doc: any) => ({
          content: `${doc.content.substring(0, 50)}...`,
          score: Number(doc.rrf_score).toFixed(3),
        }));

        response.write(`data: ${JSON.stringify({ status: StreamStatus.Retrieved, docs })}\n\n`);
      }

      if (chunk.grade) {
        response.write(`data: ${JSON.stringify({ status: StreamStatus.Grading, passed: chunk.grade.contextGraded })}\n\n`);
        finalState = Object.values(chunk)[0];

        if (!chunk.grade.contextGraded && loopCount >= 2) {
          fallbackTriggered = true;
          break;
        }
      }

      finalState = Object.values(chunk)[0];
    }

    const docs = finalState?.retrievedDocs || [];
    const context = docs.map((doc: any) => doc.content).join("\n---\n");

    const prompt =
      fallbackTriggered || finalState?.contextGraded === false
        ? `The user asked: ${query}. Our retrieval database does not contain this information.
State explicitly that you cannot find this in the documentation and DO NOT hallucinate an answer.`
        : `You are Echo. Answer using ONLY the provided context. If the context is empty, apologize and admit you do not know.
Context:
${context}
Question:
${query}`;

    response.write(`data: ${JSON.stringify({ status: StreamStatus.Generating })}\n\n`);

    const resultStream = await chatModel.stream(prompt);
    let fullTextResponse = "";

    for await (const chunk of resultStream) {
      const text = chunk.content as string;
      if (text) {
        fullTextResponse += text;
        response.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    response.write(`data: ${JSON.stringify({ status: StreamStatus.Done })}\n\n`);
    response.write("data: [DONE]\n\n");

    void analyticsQueue.add("log-chat", {
      sessionId: threadId,
      query,
      response: fullTextResponse,
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
