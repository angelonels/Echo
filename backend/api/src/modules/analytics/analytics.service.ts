import { AnalyticsRepository } from "./analytics.repository.js"

export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getSummary(agentId: string) {
    const summary = await this.analyticsRepository.getSummary(agentId)

    let positive = 0.2
    let neutral = 0.5
    let negative = 0.3

    if (summary.totalLogs > 0) {
      negative = Math.min(1, summary.fallbackRate + 0.1)
      positive = Math.max(0, Math.min(1, summary.avgConfidence))
      neutral = Math.max(0, 1 - Math.min(1, positive + negative))
    }

    return {
      totalConversations: summary.totalConversations,
      totalMessages: summary.totalMessages,
      fallbackRate: Number(summary.fallbackRate.toFixed(2)),
      avgConfidence: Number(summary.avgConfidence.toFixed(2)),
      sentiment: {
        positive: Number(positive.toFixed(2)),
        neutral: Number(neutral.toFixed(2)),
        negative: Number(negative.toFixed(2)),
      },
    }
  }

  async getTopQuestions(agentId: string) {
    return {
      items: await this.analyticsRepository.getTopQuestions(agentId),
    }
  }
}
