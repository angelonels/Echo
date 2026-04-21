import { AppError } from "../../lib/errors.js"
import { ConversationsRepository } from "./conversations.repository.js"

function getSentimentLabel(avgConfidence: number, messageCount: number) {
  if (messageCount === 0) {
    return "NEUTRAL" as const
  }
  if (avgConfidence >= 0.7) {
    return "POSITIVE" as const
  }
  if (avgConfidence <= 0.35) {
    return "NEGATIVE" as const
  }
  return "NEUTRAL" as const
}

export class ConversationsService {
  constructor(private readonly conversationsRepository: ConversationsRepository) {}

  async listConversations(agentId: string) {
    return {
      items: (await this.conversationsRepository.listConversations(agentId)).map((conversation) => ({
        id: conversation.id,
        source: conversation.source,
        startedAt: new Date(conversation.startedAt).toISOString(),
        lastMessageAt: new Date(conversation.lastMessageAt).toISOString(),
        messageCount: conversation.messageCount,
        avgConfidence: Number((conversation.avgConfidence ?? 0).toFixed(2)),
        sentimentLabel: getSentimentLabel(conversation.avgConfidence ?? 0, conversation.messageCount),
      })),
    }
  }

  async getConversation(agentId: string, conversationId: string) {
    const conversation = await this.conversationsRepository.getConversation(agentId, conversationId)
    if (!conversation) {
      throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.")
    }

    return {
      id: conversation.id,
      source: conversation.source,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        confidenceScore: message.confidenceScore ?? undefined,
        retrievalStrategy: message.retrievalStrategy ?? undefined,
        createdAt: new Date(message.createdAt).toISOString(),
      })),
    }
  }
}
