import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/errors.js";
import { type AgentChatScope, ChatRepository } from "./chat.repository.js";
import { ConversationTurnService, isUuid } from "./conversation-turn.service.js";

export class ChatService {
  private readonly conversationTurnService: ConversationTurnService;

  constructor(private readonly chatRepository: ChatRepository) {
    this.conversationTurnService = new ConversationTurnService(chatRepository);
  }

  async sendPlaygroundMessage(input: {
    userId: string;
    agentId: string;
    conversationId?: string;
    message: string;
  }) {
    return this.sendAgentMessage({
      userId: input.userId,
      agentId: input.agentId,
      message: input.message,
      channel: "playground",
      conversationId: input.conversationId,
      sessionId: input.conversationId ?? randomUUID(),
    });
  }

  async sendWidgetMessage(_input?: unknown): Promise<never> {
    throw new AppError(501, "WIDGET_NOT_IMPLEMENTED", "Public widget chat is planned for phase 4.");
  }

  async getPlaygroundConversation(userId: string, agentId: string, conversationId: string) {
    const scope = await this.chatRepository.findAgentScopeByIdForUser(userId, agentId);
    if (!scope) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }

    const conversation = isUuid(conversationId)
      ? await this.chatRepository.findConversation(userId, agentId, conversationId)
      : null;

    if (!conversation) {
      return {
        id: conversationId,
        channel: "playground" as const,
        messages: [
          {
            id: `msg_${randomUUID()}`,
            role: "assistant" as const,
            content: scope.greetingMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }

    const messages = await this.chatRepository.listMessages(conversation.id);
    return {
      id: conversation.id,
      channel: "playground" as const,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        confidence: message.confidenceScore ?? undefined,
        retrievalStrategy: message.retrievalStrategy ?? undefined,
        createdAt: new Date(message.createdAt).toISOString(),
      })),
    };
  }

  private async sendAgentMessage(input: {
    userId: string;
    agentId: string;
    message: string;
    channel: "playground" | "widget";
    conversationId?: string;
    sessionId: string;
  }) {
    const scope = await this.chatRepository.findAgentScopeByIdForUser(input.userId, input.agentId);
    if (!scope) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }

    if (!scope.isActive) {
      throw new AppError(409, "AGENT_DISABLED", "This agent is currently disabled.");
    }

    return this.conversationTurnService.answer({
      scope: scope as AgentChatScope,
      message: input.message,
      channel: input.channel,
      conversationId: input.conversationId,
      sessionId: input.sessionId,
    });
  }
}
