import { boolean, customType, doublePrecision, integer, jsonb, numeric, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

const tsvectorType = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  publicAgentKey: text("public_agent_key").notNull().unique(),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").notNull().default("private"),
  baseInstructions: text("base_instructions"),
  welcomeMessage: text("welcome_message"),
  fallbackMessage: text("fallback_message"),
  retrievalMode: text("retrieval_mode").notNull().default("auto"),
  temperature: numeric("temperature").notNull().default("0.2"),
  maxContextChunks: integer("max_context_chunks").notNull().default(6),
  modelProvider: text("model_provider").notNull().default("bedrock"),
  generationModel: text("generation_model").notNull().default("amazon.nova-lite-v1:0"),
  embeddingModel: text("embedding_model").notNull().default("amazon.titan-embed-text-v2:0"),
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
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  currentVersionId: uuid("current_version_id"),
  companyId: text("company_id").notNull().default("default-company"),
  agentId: text("agent_id").notNull().default("default-agent"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull().default("text/plain"),
  storagePath: text("storage_path").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  status: text("status").notNull().default("uploaded"),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  versionNumber: integer("version_number").notNull(),
  filePath: text("file_path").notNull(),
  contentHash: text("content_hash").notNull(),
  extractionStatus: text("extraction_status").notNull().default("pending"),
  processingError: text("processing_error"),
  extractedText: text("extracted_text"),
  extractedTextHash: text("extracted_text_hash"),
  chunkCount: integer("chunk_count").notNull().default(0),
  embeddingModel: text("embedding_model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  docId: uuid("doc_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  documentVersionId: uuid("document_version_id").references(() => documentVersions.id, { onDelete: "cascade" }),
  contentHash: text("content_hash"),
  tokenCount: integer("token_count"),
  pageNumber: integer("page_number"),
  sectionTitle: text("section_title"),
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
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().default("default-company"),
  agentId: text("agent_id").notNull(),
  source: text("source").notNull().default("playground"),
  sessionId: text("session_id").notNull(),
  customerId: text("customer_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  retrievalStrategy: text("retrieval_strategy"),
  confidenceScore: doublePrecision("confidence_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const retrievalTraces = pgTable("retrieval_traces", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  channel: text("channel").notNull(),
  userQuestion: text("user_question").notNull(),
  normalizedQuestion: text("normalized_question"),
  detectedIntent: text("detected_intent"),
  retrievalStrategy: text("retrieval_strategy").notNull(),
  retrievedChunks: jsonb("retrieved_chunks").notNull().default([]),
  selectedChunks: jsonb("selected_chunks").notNull().default([]),
  promptVersion: text("prompt_version"),
  modelProvider: text("model_provider"),
  generationModel: text("generation_model"),
  embeddingModel: text("embedding_model"),
  responseType: text("response_type").notNull(),
  confidence: numeric("confidence"),
  confidenceComponents: jsonb("confidence_components").notNull().default({}),
  groundednessScore: numeric("groundedness_score"),
  citations: jsonb("citations").notNull().default([]),
  latencyMs: integer("latency_ms"),
  tokenUsage: jsonb("token_usage").notNull().default({}),
  estimatedCostUsd: numeric("estimated_cost_usd"),
  warnings: jsonb("warnings").notNull().default([]),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const feedbackEvents = pgTable("feedback_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  rating: text("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeGapEvents = pgTable("knowledge_gap_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  traceId: uuid("trace_id").references(() => retrievalTraces.id, { onDelete: "set null" }),
  question: text("question").notNull(),
  normalizedQuestion: text("normalized_question"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeGaps = pgTable("knowledge_gaps", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  exampleQuestions: jsonb("example_questions").notNull().default([]),
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  suggestedFaqQuestion: text("suggested_faq_question"),
  suggestedFaqAnswer: text("suggested_faq_answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
