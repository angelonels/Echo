import type { Request, Response } from "express"
import { isAppError } from "../../lib/errors.js"
import { AnalyticsService } from "./analytics.service.js"

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getSummary = async (request: Request, response: Response) => {
    try {
      response.status(200).json(await this.analyticsService.getSummary(String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getTopQuestions = async (request: Request, response: Response) => {
    try {
      response.status(200).json(await this.analyticsService.getTopQuestions(String(request.params.agentId)))
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
