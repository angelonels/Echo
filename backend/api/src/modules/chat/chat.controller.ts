import type { Request, Response } from "express"
import { ZodError, z } from "zod"
import { isAppError } from "../../lib/errors.js"
import { ChatService } from "./chat.service.js"

const playgroundChatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1),
})

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
      const input = playgroundChatSchema.parse(request.body)
      const result = await this.chatService.sendPlaygroundMessage({
        agentId: String(request.params.agentId),
        conversationId: input.conversationId,
        message: input.message,
      })

      response.status(200).json({
        conversationId: result.conversationId,
        message: {
          id: `msg_${result.conversationId}`,
          role: "ASSISTANT",
          content: result.answer,
          confidenceScore: result.confidenceScore,
          retrievalStrategy: result.retrievalStrategy,
          createdAt: new Date().toISOString(),
        },
        meta: {
          retrievalStrategy: result.retrievalStrategy,
          fallbackUsed: result.fallbackUsed,
          latencyMs: 0,
        },
      })
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getPlaygroundConversation = async (request: Request, response: Response) => {
    try {
      response.status(200).json(
        await this.chatService.getPlaygroundConversation(
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
      const result = await this.chatService.sendWidgetMessage({
        ...input,
        origin: request.headers.origin,
      })

      response.setHeader("Content-Type", "text/event-stream")
      response.setHeader("Cache-Control", "no-cache")
      response.setHeader("Connection", "keep-alive")

      for (const token of result.answer.split(/(\s+)/)) {
        if (!token) {
          continue
        }

        response.write(`data: ${JSON.stringify({ text: token })}\n\n`)
      }

      response.write(`data: ${JSON.stringify({ conversationId: result.conversationId })}\n\n`)
      response.write("data: [DONE]\n\n")
      response.end()
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten(),
        },
      })
      return
    }

    if (isAppError(error)) {
      response.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
      return
    }

    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
      },
    })
  }
}
