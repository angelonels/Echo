import { pgTable, uuid, text, timestamp, vector, customType, boolean, jsonb, date, doublePrecision } from 'drizzle-orm/pg-core';

const tsvectorType = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  docId: uuid('doc_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  searchVector: tsvectorType('search_vector'),
  embedding: vector('embedding', { dimensions: 1024 }),
});

export const analyticsLogs = pgTable('analytics_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: text('session_id').notNull(),
  userQuery: text('user_query').notNull(),
  agentResponse: text('agent_response').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  processed: boolean('processed').default(false),
});

export const mappedSummaries = pgTable('mapped_summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  timeWindow: timestamp('time_window', { withTimezone: true }).notNull(),
  frictionData: jsonb('friction_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const dailyInsights = pgTable('daily_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportDate: date('report_date').unique().notNull(),
  topIssues: jsonb('top_issues').notNull(),
  avgSentiment: doublePrecision('avg_sentiment'),
});
