import type { Request, Response } from "express"
import { isAppError } from "../../lib/errors.js"
import { AgentsRepository } from "../agents/agents.repository.js"
import { ChatController } from "../chat/chat.controller.js"
import { ChatRepository } from "../chat/chat.repository.js"
import { ChatService } from "../chat/chat.service.js"

export class WidgetController {
  private readonly agentsRepository = new AgentsRepository()

  private readonly chatController = new ChatController(new ChatService(new ChatRepository()))

  getConfig = async (request: Request, response: Response) => {
    try {
      const agentKey = String(request.params.agentKey ?? request.query.agentKey ?? "")
      const agent = await this.agentsRepository.findAgentByPublicKey(agentKey)

      if (!agent) {
        response.status(404).json({
          error: {
            code: "AGENT_NOT_FOUND",
            message: "Agent not found.",
          },
        })
        return
      }

      const domains = await this.agentsRepository.listAllowedDomains(agent.id)
      response.status(200).json({
        agentId: agent.id,
        agentName: agent.name,
        greetingMessage: agent.greetingMessage,
        greeting: agent.greetingMessage,
        primaryColor: agent.primaryColor,
        position: agent.launcherPosition === "left" ? "bottom-left" : "bottom-right",
        theme: {
          primaryColor: agent.primaryColor,
          position: agent.launcherPosition,
        },
        widget: {
          greeting: agent.greetingMessage,
          primaryColor: agent.primaryColor,
          position: agent.launcherPosition === "left" ? "bottom-left" : "bottom-right",
          isEnabled: agent.isActive,
        },
        isEnabled: agent.isActive,
        allowedDomains: domains,
      })
    } catch (error) {
      this.handleError(response, error)
    }
  }

  sendChat = async (request: Request, response: Response) => {
    await this.chatController.sendWidgetMessage(request, response)
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
