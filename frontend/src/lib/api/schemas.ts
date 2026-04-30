import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable().optional(),
  name: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
})

export const agentStatusSchema = z.enum(["draft", "active", "paused", "archived"])
export const retrievalModeSchema = z.enum(["auto", "naive", "multi_query", "hybrid"])

export const allowedDomainSchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    domain: z.string(),
  }),
])

export const agentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  publicAgentKey: z.string(),
  status: agentStatusSchema,
  visibility: z.string().optional(),
  welcomeMessage: z.string().nullable().optional(),
  retrievalMode: retrievalModeSchema.optional(),
  modelProvider: z.string().optional(),
  generationModel: z.string().optional(),
  embeddingModel: z.string().optional(),
  documentCount: z.number().default(0),
  conversationCount: z.number().default(0),
  updatedAt: z.string(),
  isActive: z.boolean(),
})

export const agentDetailSchema = agentSummarySchema.extend({
  baseInstructions: z.string().nullable().optional(),
  fallbackMessage: z.string().nullable().optional(),
  temperature: z.number().default(0.2),
  maxContextChunks: z.number().default(6),
  allowedDomains: z.array(allowedDomainSchema).default([]),
  createdAt: z.string().optional(),
  greetingMessage: z.string().optional(),
  primaryColor: z.string().optional(),
  launcherPosition: z.enum(["left", "right"]).optional(),
})

export const createAgentSchema = z.object({
  name: z.string().min(2, "Agent name is required."),
  description: z.string().max(1000).optional().nullable(),
  baseInstructions: z.string().max(4000).optional().nullable(),
  welcomeMessage: z.string().min(1, "Welcome message is required.").max(500),
  fallbackMessage: z.string().min(1, "Fallback message is required.").max(500),
  status: agentStatusSchema.default("active"),
  retrievalMode: retrievalModeSchema.default("auto"),
  temperature: z.coerce.number().min(0).max(2).default(0.2),
  maxContextChunks: z.coerce.number().int().min(1).max(20).default(6),
})

export const documentStatusSchema = z.enum([
  "uploaded",
  "extracting",
  "chunking",
  "embedding",
  "indexing",
  "ready",
  "failed",
])

export const documentSchema = z.object({
  id: z.string(),
  agentId: z.string().optional(),
  originalFilename: z.string().optional(),
  displayName: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number(),
  status: documentStatusSchema,
  currentVersionId: z.string().nullable().optional(),
  versionNumber: z.number().nullable().optional(),
  chunkCount: z.number().default(0),
  processingError: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export const documentListSchema = z.object({
  items: z.array(documentSchema),
})

export const citationSchema = z.object({
  documentId: z.string(),
  documentTitle: z.string(),
  chunkId: z.string(),
  excerpt: z.string(),
})

export const playgroundMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  confidence: z.number().optional(),
  confidenceScore: z.number().optional(),
  retrievalStrategy: z.string().optional(),
  createdAt: z.string().optional(),
})

export const playgroundConversationSchema = z.object({
  id: z.string(),
  channel: z.enum(["playground", "widget"]).default("playground"),
  messages: z.array(playgroundMessageSchema),
})

export const playgroundChatResponseSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  answer: z.string(),
  responseType: z.enum(["grounded_answer", "clarifying_question", "fallback", "unsafe_request_blocked"]),
  confidence: z.number(),
  citations: z.array(citationSchema),
  traceId: z.string(),
  retrievalStrategy: z.string(),
  latencyMs: z.number(),
})

export const analyticsSummarySchema = z.object({
  totalConversations: z.number().default(0),
  totalMessages: z.number().default(0),
  fallbackRate: z.number().default(0),
  avgConfidence: z.number().default(0),
  avgLatencyMs: z.number().optional(),
  sentiment: z
    .object({
      positive: z.number(),
      neutral: z.number(),
      negative: z.number(),
    })
    .default({ positive: 0, neutral: 0, negative: 0 }),
})

export const topQuestionSchema = z.object({
  question: z.string(),
  count: z.number(),
})

export const topQuestionsSchema = z.object({
  items: z.array(topQuestionSchema),
})

export const conversationSummarySchema = z.object({
  id: z.string(),
  source: z.enum(["playground", "widget"]).or(z.enum(["PLAYGROUND", "WIDGET"])),
  startedAt: z.string(),
  lastMessageAt: z.string(),
  messageCount: z.number(),
  avgConfidence: z.number(),
  sentimentLabel: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
})

export const conversationSummariesSchema = z.object({
  items: z.array(conversationSummarySchema),
})

export const widgetConfigSchema = z.object({
  agentName: z.string(),
  greetingMessage: z.string(),
  theme: z.object({
    primaryColor: z.string(),
    position: z.enum(["left", "right"]),
  }),
})

export type CreateAgentValues = z.input<typeof createAgentSchema>
export type User = z.infer<typeof userSchema>
export type Company = { id: string; name: string; slug: string }
export type AgentSummary = z.infer<typeof agentSummarySchema>
export type AgentDetail = z.infer<typeof agentDetailSchema>
export type DocumentRecord = z.infer<typeof documentSchema>
export type PlaygroundMessage = z.infer<typeof playgroundMessageSchema>
export type PlaygroundConversation = z.infer<typeof playgroundConversationSchema>
export type PlaygroundChatResponse = z.infer<typeof playgroundChatResponseSchema>
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>
export type TopQuestion = z.infer<typeof topQuestionSchema>
export type ConversationSummary = z.infer<typeof conversationSummarySchema>
export type WidgetConfig = z.infer<typeof widgetConfigSchema>
