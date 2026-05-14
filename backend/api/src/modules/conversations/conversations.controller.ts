import type { Request, Response } from "express"
import { getAuthenticatedUser } from "../../lib/auth.js"
import { sendErrorResponse } from "../../lib/http.js"
import { ConversationsService } from "./conversations.service.js"

export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  listConversations = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response
        .status(200)
        .json(await this.conversationsService.listConversations(auth.userId, String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getConversation = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json(
        await this.conversationsService.getConversation(
          auth.userId,
          String(request.params.agentId),
          String(request.params.conversationId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error)
  }
}
