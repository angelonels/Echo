import { boolean, date, doublePrecision, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const analyticsLogs = pgTable("analytics_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull(),
  userQuery: text("user_query").notNull(),
  agentResponse: text("agent_response").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  processed: boolean("processed").default(false),
});

export const mappedSummaries = pgTable("mapped_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  timeWindow: timestamp("time_window", { withTimezone: true }).notNull(),
  frictionData: jsonb("friction_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const dailyInsights = pgTable("daily_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportDate: date("report_date").unique().notNull(),
  topIssues: jsonb("top_issues").notNull(),
  avgSentiment: doublePrecision("avg_sentiment"),
});
