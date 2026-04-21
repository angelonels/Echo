import { eq, gte } from "drizzle-orm"
import { invokeAnalyticsModel } from "../lib/bedrock.js"
import { db } from "../lib/db.js"
import { analyticsLogs, dailyInsights, mappedSummaries } from "../lib/schema.js"
import { logger } from "../lib/logger.js"

export class AnalyticsAggregationService {
  async processMapJob() {
    const logs = await db.select().from(analyticsLogs).where(eq(analyticsLogs.processed, false)).limit(100)

    if (!logs.length) {
      logger.info("No unprocessed logs found for map job")
      return
    }

    const rawText = logs.map((entry) => `Query: ${entry.userQuery} | Response: ${entry.agentResponse}`).join("\n---\n")
    const prompt = `Analyze these ${logs.length} chat logs. Return a strict JSON array of the top 3 friction points you identify, their estimated frequency, and an average sentiment score (-1 to 1).

Logs:
${rawText}

Respond ONLY with a JSON map in the exact format:
{"top_issues": [{"name": "Issue", "count": 10}], "avg_sentiment": 0.5}`

    const rawContent = await invokeAnalyticsModel(prompt)
    const content = rawContent.replace(/```json/gi, "").replace(/```/g, "")
    const data = JSON.parse(content)

    await db.transaction(async (transaction) => {
      await transaction.insert(mappedSummaries).values({
        timeWindow: new Date(),
        frictionData: data,
      })

      for (const item of logs) {
        await transaction.update(analyticsLogs).set({ processed: true }).where(eq(analyticsLogs.id, item.id))
      }
    })

    logger.info({ count: logs.length }, "Completed map job")
  }

  async processReduceJob() {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const summaries = await db.select().from(mappedSummaries).where(gte(mappedSummaries.createdAt, twentyFourHoursAgo))

    if (!summaries.length) {
      logger.info("No mapped summaries found for reduce job")
      return
    }

    const rawText = summaries.map((summary) => JSON.stringify(summary.frictionData)).join("\n---\n")
    const prompt = `You are a data analyst. Aggregate these hourly frequency maps into the definitive Top 5 Global Friction Points for the day. You must recalculate the true frequencies globally, ignoring minor disparities, grouping identical issues together. Average the overall sentiment correctly.

Hourly Maps:
${rawText}

Respond ONLY with a JSON map in the exact format:
{"top_issues": [{"name": "Global Issue", "count": 100}], "avg_sentiment": 0.5}`

    const rawContent = await invokeAnalyticsModel(prompt)
    const content = rawContent.replace(/```json/gi, "").replace(/```/g, "")
    const data = JSON.parse(content)
    const today = new Date().toISOString().split("T")[0]

    await db
      .insert(dailyInsights)
      .values({
        reportDate: today,
        topIssues: data.top_issues,
        avgSentiment: data.avg_sentiment,
      })
      .onConflictDoUpdate({
        target: dailyInsights.reportDate,
        set: {
          topIssues: data.top_issues,
          avgSentiment: data.avg_sentiment,
        },
      })

    logger.info("Completed reduce job")
  }
}
