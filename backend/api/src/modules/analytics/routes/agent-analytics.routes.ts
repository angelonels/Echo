import { Router } from "express"
import { AnalyticsController } from "../analytics.controller.js"
import { AnalyticsRepository } from "../analytics.repository.js"
import { AnalyticsService } from "../analytics.service.js"

const analyticsRepository = new AnalyticsRepository()
const analyticsService = new AnalyticsService(analyticsRepository)
const analyticsController = new AnalyticsController(analyticsService)

export const agentAnalyticsRouter = Router({ mergeParams: true })

agentAnalyticsRouter.get("/summary", analyticsController.getSummary)
agentAnalyticsRouter.get("/top-questions", analyticsController.getTopQuestions)
