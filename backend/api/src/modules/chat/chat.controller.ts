import type { Request, Response } from "express"
import { z } from "zod"
import { playgroundChatRequestSchema } from "@echo/shared"
import { getAuthenticatedUser } from "../../lib/auth.js"
import { sendErrorResponse } from "../../lib/http.js"
import { ChatService } from "./chat.service.js"

const widgetChatSchema = z.object({
  agentKey: z.string().min(1),
  conversationId: z.string().optional(),
  sessionId: z.string().min(1),
  customerId: z.string().optional(),
  customerMetadata: z.record(z.string(), z.unknown()).optional(),
  message: z.string().min(1),
})

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  sendPlaygroundMessage = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      const input = playgroundChatRequestSchema.parse(request.body)
      const result = await this.chatService.sendPlaygroundMessage({
        userId: auth.userId,
        agentId: String(request.params.agentId),
        conversationId: input.conversationId,
        message: input.message,
      })

      response.status(200).json({
        conversationId: result.conversationId,
        messageId: result.messageId,
        answer: result.answer,
        responseType: result.responseType,
        confidence: result.confidence,
        citations: result.citations,
        traceId: result.traceId,
        retrievalStrategy: result.retrievalStrategy,
        latencyMs: result.latencyMs,
      })
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getPlaygroundConversation = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json(
        await this.chatService.getPlaygroundConversation(
          auth.userId,
          String(request.params.agentId),
          String(request.params.conversationId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  sendWidgetMessage = async (request: Request, response: Response) => {
    try {
      const input = widgetChatSchema.parse(request.body)
      await this.chatService.sendWidgetMessage({
        ...input,
        origin: request.headers.origin,
      })
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error)
  }
}
