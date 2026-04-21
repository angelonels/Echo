import { randomUUID } from "node:crypto"
import { AppError } from "../../lib/errors.js"
import { analyticsQueue } from "../../lib/queues.js"
import { retrievalOrchestrator } from "../../lib/retrieval.js"
import { ChatRepository } from "./chat.repository.js"

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async sendPlaygroundMessage(input: {
    agentId: string
    conversationId?: string
    message: string
  }) {
    return this.sendAgentMessage({
      agentId: input.agentId,
      message: input.message,
      source: "PLAYGROUND",
      conversationId: input.conversationId,
      sessionId: input.conversationId ?? randomUUID(),
    })
  }

  async sendWidgetMessage(input: {
    agentKey: string
    conversationId?: string
    sessionId: string
    customerId?: string
    message: string
    origin?: string
  }) {
    const scope = await this.chatRepository.findAgentScopeByPublicKey(input.agentKey)
    if (!scope) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    this.ensureWidgetAccess(scope.allowedDomains, input.origin)

    return this.sendAgentMessage({
      agentId: scope.agentId,
      message: input.message,
      source: "WIDGET",
      conversationId: input.conversationId,
      sessionId: input.sessionId,
      customerId: input.customerId,
    })
  }

  async getPlaygroundConversation(agentId: string, conversationId: string) {
    const scope = await this.chatRepository.findAgentScopeById(agentId)
    if (!scope) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    const conversation = isUuid(conversationId)
      ? await this.chatRepository.findConversation(agentId, conversationId)
      : null

    if (!conversation) {
      return {
        id: conversationId,
        source: "PLAYGROUND" as const,
        messages: [
          {
            id: `msg_${randomUUID()}`,
            role: "ASSISTANT" as const,
            content: scope.greetingMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    }

    const messages = await this.chatRepository.listMessages(conversation.id)
    return {
      id: conversation.id,
      source: "PLAYGROUND" as const,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        confidenceScore: message.confidenceScore ?? undefined,
        retrievalStrategy: message.retrievalStrategy ?? undefined,
        createdAt: new Date(message.createdAt).toISOString(),
      })),
    }
  }

  private async sendAgentMessage(input: {
    agentId: string
    message: string
    source: "PLAYGROUND" | "WIDGET"
    conversationId?: string
    sessionId: string
    customerId?: string
  }) {
    const scope = await this.chatRepository.findAgentScopeById(input.agentId)
    if (!scope) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    if (!scope.isActive) {
      throw new AppError(409, "AGENT_DISABLED", "This agent is currently disabled.")
    }

    const existingConversation =
      input.conversationId && isUuid(input.conversationId)
        ? await this.chatRepository.findConversation(scope.agentId, input.conversationId)
        : null

    const conversation =
      existingConversation ??
      (await this.chatRepository.createConversation({
        companyId: scope.companyId,
        agentId: scope.agentId,
        source: input.source,
        sessionId: input.sessionId,
        customerId: input.customerId,
      }))

    const previousMessages = await this.chatRepository.listMessages(conversation.id, 12)

    await this.chatRepository.insertMessage({
      conversationId: conversation.id,
      role: "USER",
      content: input.message,
    })

    const result = await retrievalOrchestrator.run({
      query: input.message,
      companyId: scope.companyId,
      agentId: scope.agentId,
      conversation: previousMessages.slice(-6).map((message) => ({
        role: message.role === "USER" ? "user" : "assistant",
        content: message.content,
      })),
    })

    await this.chatRepository.insertMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: result.answer,
      retrievalStrategy: result.strategy,
      confidenceScore: result.confidence,
    })

    void analyticsQueue.add("log-chat", {
      companyId: scope.companyId,
      agentId: scope.agentId,
      conversationId: conversation.id,
      sessionId: input.sessionId,
      source: input.source,
      query: input.message,
      response: result.answer,
      strategy: result.strategy,
      confidence: result.confidence,
      fallbackUsed: result.shouldFallback,
    })

    return {
      conversationId: conversation.id,
      answer: result.answer,
      retrievalStrategy: result.strategy,
      confidenceScore: result.confidence,
      fallbackUsed: result.shouldFallback,
    }
  }

  private ensureWidgetAccess(allowedDomains: string[], origin?: string) {
    if (!allowedDomains.length || !origin) {
      return
    }

    let host: string
    try {
      host = new URL(origin).host
    } catch {
      throw new AppError(403, "DOMAIN_NOT_ALLOWED", "Widget requests must originate from an allowed domain.")
    }

    if (!allowedDomains.includes(host)) {
      throw new AppError(403, "DOMAIN_NOT_ALLOWED", "Widget requests must originate from an allowed domain.")
    }
  }
}
