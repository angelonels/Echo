import type { Request, Response } from "express"
import { getAuthenticatedUser } from "../../lib/auth.js"
import { sendErrorResponse } from "../../lib/http.js"
import { AnalyticsService } from "./analytics.service.js"

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getSummary = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json(await this.analyticsService.getSummary(auth.userId, String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getTopQuestions = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response
        .status(200)
        .json(await this.analyticsService.getTopQuestions(auth.userId, String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error)
  }
}
