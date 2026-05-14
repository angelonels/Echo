import { randomUUID } from "node:crypto";
import { retrievalOrchestrator } from "../../lib/retrieval.js";
import { TracesRepository } from "../traces/traces.repository.js";
import type { AgentChatScope, ChatRepository } from "./chat.repository.js";

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

export class ConversationTurnService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly tracesRepository = new TracesRepository(),
  ) {}

  async answer(input: {
    scope: AgentChatScope;
    message: string;
    channel: "playground" | "widget";
    conversationId?: string;
    sessionId?: string;
  }) {
    const startedAt = Date.now();
    const existingConversation =
      input.conversationId && isUuid(input.conversationId)
        ? await this.chatRepository.findConversation(input.scope.userId, input.scope.agentId, input.conversationId)
        : null;

    const conversation =
      existingConversation ??
      (await this.chatRepository.createConversation({
        userId: input.scope.userId,
        agentId: input.scope.agentId,
        channel: input.channel,
        sessionId: input.sessionId || randomUUID(),
      }));

    const previousMessages = await this.chatRepository.listMessages(conversation.id, 12);

    await this.chatRepository.insertMessage({
      userId: input.scope.userId,
      agentId: input.scope.agentId,
      conversationId: conversation.id,
      role: "user",
      content: input.message,
    });

    const result = await retrievalOrchestrator.run({
      query: input.message,
      userId: input.scope.userId,
      agentId: input.scope.agentId,
      channel: input.channel,
      conversation: previousMessages.slice(-6).map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    });
    const latencyMs = Date.now() - startedAt;

    const assistantMessage = await this.chatRepository.insertMessage({
      userId: input.scope.userId,
      agentId: input.scope.agentId,
      conversationId: conversation.id,
      role: "assistant",
      content: result.answer,
      retrievalStrategy: result.strategy,
      confidenceScore: result.confidence,
    });

    const traceId = await this.tracesRepository.persistRetrievalTrace({
      userId: input.scope.userId,
      agentId: input.scope.agentId,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      channel: input.channel,
      userQuestion: input.message,
      normalizedQuestion: result.normalizedQuestion,
      detectedIntent: result.classification.intent,
      retrievalStrategy: result.strategy,
      retrievedChunks: result.context,
      selectedChunks: result.selectedChunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        rank: chunk.rank,
        score: chunk.combinedScore,
        excerpt: chunk.content.slice(0, 500),
      })),
      modelProvider: input.scope.modelProvider,
      generationModel: input.scope.generationModel,
      embeddingModel: input.scope.embeddingModel,
      responseType: result.responseType,
      confidence: result.confidence,
      confidenceComponents: result.confidenceComponents,
      citations: result.citations,
      latencyMs,
      warnings: result.shouldFallback ? ["FALLBACK_TRIGGERED"] : [],
    });

    return {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      answer: result.answer,
      responseType: result.responseType,
      confidence: result.confidence,
      citations: result.citations,
      traceId,
      retrievalStrategy: result.strategy,
      latencyMs,
      fallbackUsed: result.shouldFallback,
    };
  }
}
