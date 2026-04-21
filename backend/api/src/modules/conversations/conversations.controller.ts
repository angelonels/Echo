import type { Request, Response } from "express"
import { isAppError } from "../../lib/errors.js"
import { ConversationsService } from "./conversations.service.js"

export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  listConversations = async (request: Request, response: Response) => {
    try {
      response.status(200).json(await this.conversationsService.listConversations(String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getConversation = async (request: Request, response: Response) => {
    try {
      response.status(200).json(
        await this.conversationsService.getConversation(
          String(request.params.agentId),
          String(request.params.conversationId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
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
