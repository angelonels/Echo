import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  email: z.email(),
  fullName: z.string(),
  role: z.enum(["OWNER", "ADMIN"]),
})

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})

export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const authSignupResponseSchema = z.object({
  user: userSchema,
  company: companySchema,
  tokens: tokenPairSchema,
})

export const authLoginResponseSchema = z.object({
  user: userSchema,
  tokens: tokenPairSchema,
})

export const authFormSchema = z.object({
  email: z.email("Enter a valid work email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password needs an uppercase letter.")
    .regex(/[a-z]/, "Password needs a lowercase letter.")
    .regex(/[0-9]/, "Password needs a number."),
})

export const signupFormSchema = authFormSchema.extend({
  companyName: z.string().min(2, "Company name is required."),
  fullName: z.string().min(2, "Full name is required."),
})

export const launcherPositionSchema = z.enum(["left", "right"])

export const agentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  publicAgentKey: z.string(),
  isActive: z.boolean(),
  documentCount: z.number(),
  conversationCount: z.number(),
  updatedAt: z.string(),
})

export const agentDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  publicAgentKey: z.string(),
  greetingMessage: z.string(),
  primaryColor: z.string(),
  launcherPosition: launcherPositionSchema,
  allowedDomains: z.array(z.string()),
  isActive: z.boolean(),
})

export const createAgentSchema = z.object({
  name: z.string().min(2, "Agent name is required."),
  description: z.string().min(8, "Add a slightly more specific description."),
  greetingMessage: z.string().min(8, "Greeting message is required."),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Use a hex color."),
  launcherPosition: launcherPositionSchema,
})

export const documentStatusSchema = z.enum([
  "UPLOADED",
  "PROCESSING",
  "READY",
  "FAILED",
])

export const documentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.string().optional(),
  sizeBytes: z.number(),
  status: documentStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  versionGroupKey: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
})

export const documentListSchema = z.object({
  items: z.array(documentSchema),
})

export const playgroundMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string(),
  confidenceScore: z.number().optional(),
  retrievalStrategy: z.string().optional(),
  createdAt: z.string().optional(),
})

export const playgroundConversationSchema = z.object({
  id: z.string(),
  source: z.enum(["PLAYGROUND", "WIDGET"]),
  messages: z.array(playgroundMessageSchema),
})

export const playgroundChatResponseSchema = z.object({
  conversationId: z.string(),
  message: playgroundMessageSchema,
  meta: z.object({
    retrievalStrategy: z.string(),
    fallbackUsed: z.boolean(),
    latencyMs: z.number(),
  }),
})

export const analyticsSummarySchema = z.object({
  totalConversations: z.number(),
  totalMessages: z.number(),
  fallbackRate: z.number(),
  avgConfidence: z.number(),
  sentiment: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
  }),
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
  source: z.enum(["PLAYGROUND", "WIDGET"]),
  startedAt: z.string(),
  lastMessageAt: z.string(),
  messageCount: z.number(),
  avgConfidence: z.number(),
  sentimentLabel: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
})

export const conversationSummariesSchema = z.object({
  items: z.array(conversationSummarySchema),
})

export const widgetConfigSchema = z.object({
  agentName: z.string(),
  greetingMessage: z.string(),
  theme: z.object({
    primaryColor: z.string(),
    position: launcherPositionSchema,
  }),
})

export type AuthFormValues = z.infer<typeof authFormSchema>
export type SignupFormValues = z.infer<typeof signupFormSchema>
export type CreateAgentValues = z.infer<typeof createAgentSchema>
export type User = z.infer<typeof userSchema>
export type Company = z.infer<typeof companySchema>
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
