import {
  boolean,
  customType,
  date,
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

const tsvectorType = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: text("company_id").notNull().default("default-company"),
  agentId: text("agent_id").notNull().default("default-agent"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull().default("text/plain"),
  storagePath: text("storage_path").notNull(),
  status: text("status").notNull().default("UPLOADED"),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull().default("You are Echo."),
  allowedDomains: jsonb("allowed_domains").notNull().default([]),
  publicApiKey: uuid("public_api_key").defaultRandom().notNull(),
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  docId: uuid("doc_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").notNull().default("default-company"),
  agentId: text("agent_id").notNull().default("default-agent"),
  chunkIndex: text("chunk_index").notNull().default("0"),
  content: text("content").notNull(),
  searchVector: tsvectorType("search_vector"),
  embedding: vector("embedding", { dimensions: 1024 }),
  metadata: jsonb("metadata").notNull().default({}),
});

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
