import type { Request, Response } from "express"
import { sendErrorResponse } from "../../lib/http.js"
import { findPublicAgentScopeByKey } from "../../lib/public-agent-scope.js"
import { ChatController } from "../chat/chat.controller.js"
import { ChatRepository } from "../chat/chat.repository.js"
import { ChatService } from "../chat/chat.service.js"
import { WidgetService } from "./widget.service.js"

export class WidgetController {
  private readonly chatController = new ChatController(new ChatService(new ChatRepository()))
  private readonly widgetService = new WidgetService()

  getConfig = async (request: Request, response: Response) => {
    try {
      const agentKey = String(request.params.agentKey ?? request.query.agentKey ?? "")
      const agent = await findPublicAgentScopeByKey(agentKey)

      if (!agent) {
        response.status(404).json({
          error: {
            code: "AGENT_NOT_FOUND",
            message: "Agent not found.",
          },
        })
        return
      }

      this.widgetService.assertWidgetCanRun(agent, request.headers.origin)

      response.status(200).json({
        agentId: agent.agentId,
        agentName: agent.agentName,
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
        allowedDomains: agent.allowedDomains,
      })
    } catch (error) {
      this.handleError(response, error)
    }
  }

  sendChat = async (request: Request, response: Response) => {
    await this.chatController.sendWidgetMessage(request, response)
  }

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error)
  }
}
