import {
  boolean,
  customType,
  date,
  doublePrecision,
  integer,
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
  sizeBytes: integer("size_bytes").notNull().default(0),
  status: text("status").notNull().default("UPLOADED"),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().default("default-company"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("OWNER"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  greetingMessage: text("greeting_message").notNull().default("Hi, I'm Echo. How can I help?"),
  primaryColor: text("primary_color").notNull().default("#11b5a4"),
  launcherPosition: text("launcher_position").notNull().default("right"),
  isActive: boolean("is_active").notNull().default(true),
  systemPrompt: text("system_prompt").notNull().default("You are Echo."),
  allowedDomains: jsonb("allowed_domains").notNull().default([]),
  publicApiKey: uuid("public_api_key").defaultRandom().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const allowedDomains = pgTable("allowed_domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: text("company_id").notNull().default("default-company"),
  agentId: text("agent_id").notNull(),
  source: text("source").notNull().default("PLAYGROUND"),
  sessionId: text("session_id").notNull(),
  customerId: text("customer_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  retrievalStrategy: text("retrieval_strategy"),
  confidenceScore: doublePrecision("confidence_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const analyticsLogs = pgTable("analytics_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: text("company_id").notNull().default("default-company"),
  agentId: text("agent_id").notNull().default("default-agent"),
  conversationId: text("conversation_id"),
  source: text("source").notNull().default("PLAYGROUND"),
  sessionId: text("session_id").notNull(),
  userQuery: text("user_query").notNull(),
  agentResponse: text("agent_response").notNull(),
  retrievalStrategy: text("retrieval_strategy"),
  confidenceScore: doublePrecision("confidence_score"),
  fallbackUsed: boolean("fallback_used").default(false),
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
