import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

import {
  agentDetailSchema,
  agentSummarySchema,
  analyticsSummarySchema,
  conversationSummariesSchema,
  createAgentSchema,
  documentListSchema,
  documentSchema,
  playgroundChatResponseSchema,
  playgroundConversationSchema,
  topQuestionsSchema,
  widgetConfigSchema,
  type AgentDetail,
  type AgentSummary,
  type AnalyticsSummary,
  type ConversationSummary,
  type CreateAgentValues,
  type DocumentRecord,
  type PlaygroundConversation,
  type PlaygroundChatResponse,
  type TopQuestion,
  type WidgetConfig,
} from "@/lib/api/schemas"
import {
  buildAssistantReply,
  mockAgentDetails,
  mockAgents,
  mockAnalyticsSummary,
  mockConversationSummaries,
  mockConversations,
  mockDocuments,
  mockTopQuestions,
  mockWidgetConfigs,
} from "@/lib/api/mock-data"

const apiBaseUrl = process.env.NEXT_PUBLIC_ECHO_API_URL

type SourceTagged<T> = T & { source: "api" | "mock" }

async function getAccessToken() {
  if (typeof window !== "undefined") {
    return window.Clerk?.session?.getToken() ?? null
  }

  try {
    const session = await auth()
    return await session.getToken()
  } catch {
    return null
  }
}

async function parseResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const json = await response.json()
  return schema.parse(json)
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  fallback: T,
  init?: RequestInit
): Promise<SourceTagged<T>> {
  if (!apiBaseUrl) {
    return { ...fallback, source: "mock" }
  }

  try {
    const accessToken = await getAccessToken()
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`)
    }

    const data = await parseResponse(response, schema)
    return { ...data, source: "api" }
  } catch {
    return { ...fallback, source: "mock" }
  }
}

export async function getAgents(): Promise<SourceTagged<{ items: AgentSummary[] }>> {
  return request(
    "/api/v1/agents",
    z.object({ items: z.array(agentSummarySchema) }),
    { items: normalizeMockAgents() }
  )
}

export async function getAgent(agentId: string): Promise<SourceTagged<AgentDetail>> {
  const fallback = normalizeMockAgent(mockAgentDetails[agentId] ?? mockAgentDetails[mockAgents[0].id])
  return request(`/api/v1/agents/${agentId}`, agentDetailSchema, fallback)
}

export async function createAgent(values: CreateAgentValues): Promise<SourceTagged<AgentDetail>> {
  const payload = createAgentSchema.parse(values)
  const fallback: AgentDetail = {
    id: "agt_new_launchpad",
    publicAgentKey: "agent_pub_new_launchpad",
    allowedDomains: [],
    documentCount: 0,
    conversationCount: 0,
    updatedAt: new Date().toISOString(),
    isActive: payload.status === "active",
    visibility: "private",
    modelProvider: "bedrock",
    generationModel: "amazon.nova-lite-v1:0",
    embeddingModel: "amazon.titan-embed-text-v2:0",
    createdAt: new Date().toISOString(),
    ...payload,
  }

  return request("/api/v1/agents", agentDetailSchema, fallback, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAgent(
  agentId: string,
  values: Partial<CreateAgentValues>
): Promise<SourceTagged<AgentDetail>> {
  const fallback = {
    ...normalizeMockAgent(mockAgentDetails[agentId] ?? mockAgentDetails[mockAgents[0].id]),
    ...createAgentSchema.partial().parse(values),
  } satisfies AgentDetail

  return request(`/api/v1/agents/${agentId}`, agentDetailSchema, fallback, {
    method: "PATCH",
    body: JSON.stringify(values),
  })
}

export async function getAgentDocuments(
  agentId: string
): Promise<SourceTagged<{ items: DocumentRecord[] }>> {
  return request(
    `/api/v1/agents/${agentId}/documents`,
    documentListSchema,
    { items: normalizeMockDocuments(mockDocuments[agentId] ?? []) }
  )
}

export async function uploadDocument(
  agentId: string,
  file: File
): Promise<SourceTagged<{ document: DocumentRecord }>> {
  if (!apiBaseUrl) {
    return {
      document: normalizeDocument({
        id: `doc_${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        status: "uploaded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chunkCount: 0,
      }),
      source: "mock",
    }
  }

  const formData = new FormData()
  formData.append("file", file)

  try {
    const accessToken = await getAccessToken()
    const response = await fetch(`${apiBaseUrl}/api/v1/agents/${agentId}/documents`, {
      method: "POST",
      body: formData,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}`)
    }

    const data = await response.json()
    const document = documentSchema.parse(data.document)
    return { document, source: "api" }
  } catch {
    return {
      document: normalizeDocument({
        id: `doc_${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        status: "uploaded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chunkCount: 0,
      }),
      source: "mock",
    }
  }
}

export async function getPlaygroundConversation(
  agentId: string
): Promise<SourceTagged<PlaygroundConversation>> {
  return request(
    `/api/v1/agents/${agentId}/playground/conversations/con_preview`,
    playgroundConversationSchema,
    normalizeConversation(mockConversations[agentId] ?? mockConversations[mockAgents[0].id])
  )
}

export async function sendPlaygroundMessage(
  agentId: string,
  conversationId: string,
  message: string
): Promise<SourceTagged<PlaygroundChatResponse>> {
  const assistant = buildAssistantReply(message)
  const fallback: PlaygroundChatResponse = {
    conversationId,
    messageId: assistant.id,
    answer: assistant.content,
    responseType: assistant.retrievalStrategy === "FALLBACK" ? "fallback" : "grounded_answer",
    confidence: assistant.confidenceScore ?? 0.78,
    citations: [
      {
        documentId: "mock-doc",
        documentTitle: "Demo knowledge base",
        chunkId: "mock-chunk",
        excerpt: "Matched retrieval chunks from uploaded policies and service documentation.",
      },
    ],
    traceId: "00000000-0000-4000-8000-000000000000",
    retrievalStrategy: assistant.retrievalStrategy?.toLowerCase() ?? "multi_query",
    latencyMs: 1180,
  }

  return request(
    `/api/v1/agents/${agentId}/playground/chat`,
    playgroundChatResponseSchema,
    fallback,
    {
      method: "POST",
      body: JSON.stringify({ conversationId, message }),
    }
  )
}

export async function getAnalyticsSummary(
  agentId: string
): Promise<SourceTagged<AnalyticsSummary>> {
  return request(
    `/api/v1/agents/${agentId}/analytics/summary`,
    analyticsSummarySchema,
    mockAnalyticsSummary[agentId] ?? mockAnalyticsSummary[mockAgents[0].id]
  )
}

export async function getTopQuestions(
  agentId: string
): Promise<SourceTagged<{ items: TopQuestion[] }>> {
  return request(
    `/api/v1/agents/${agentId}/analytics/top-questions`,
    topQuestionsSchema,
    { items: mockTopQuestions[agentId] ?? [] }
  )
}

export async function getConversationSummaries(
  agentId: string
): Promise<SourceTagged<{ items: ConversationSummary[] }>> {
  return request(
    `/api/v1/agents/${agentId}/conversations`,
    conversationSummariesSchema,
    { items: mockConversationSummaries[agentId] ?? [] }
  )
}

export async function getWidgetConfig(
  agentId: string,
  agentKey?: string
): Promise<SourceTagged<WidgetConfig>> {
  const detail = normalizeMockAgent(mockAgentDetails[agentId] ?? mockAgentDetails[mockAgents[0].id])
  return request(
    `/api/v1/widget/config/${agentKey ?? detail.publicAgentKey}`,
    widgetConfigSchema,
    mockWidgetConfigs[agentId] ?? mockWidgetConfigs[mockAgents[0].id]
  )
}

export async function getDashboardSnapshot() {
  const agents = await getAgents()

  return {
    agents,
    summary: {
      totalConversations: agents.items.reduce((sum, agent) => sum + agent.conversationCount, 0),
      totalMessages: 0,
      fallbackRate: 0,
      avgConfidence: 0,
      source: agents.source,
    },
    currentUser: null,
  }
}

function normalizeMockAgents(): AgentSummary[] {
  return mockAgents.map((agent) => agentSummarySchema.parse({
    ...agent,
    status: agent.isActive ? "active" : "paused",
    updatedAt: agent.updatedAt,
  }))
}

function normalizeMockAgent(agent: Record<string, unknown>): AgentDetail {
  return agentDetailSchema.parse({
    status: agent.isActive ? "active" : "paused",
    visibility: "private",
    welcomeMessage: agent.greetingMessage ?? "Hi. Ask me anything about this product.",
    fallbackMessage: "I do not have enough information from the available support docs to answer that confidently.",
    baseInstructions: "Answer only from uploaded documents.",
    retrievalMode: "auto",
    modelProvider: "bedrock",
    generationModel: "amazon.nova-lite-v1:0",
    embeddingModel: "amazon.titan-embed-text-v2:0",
    documentCount: 0,
    conversationCount: 0,
    updatedAt: new Date().toISOString(),
    isActive: true,
    allowedDomains: [],
    ...agent,
  })
}

function normalizeDocument(document: Record<string, unknown>): DocumentRecord {
  return documentSchema.parse({
    chunkCount: 0,
    ...document,
    displayName: document.displayName ?? document.fileName ?? document.originalFilename,
    originalFilename: document.originalFilename ?? document.fileName ?? document.displayName,
  })
}

function normalizeMockDocuments(documents: Array<Record<string, unknown>>): DocumentRecord[] {
  return documents.map((document) => normalizeDocument({
    ...document,
    status: String(document.status ?? "uploaded").toLowerCase(),
  }))
}

function normalizeConversation(conversation: PlaygroundConversation): PlaygroundConversation {
  return playgroundConversationSchema.parse({
    ...conversation,
    channel: "playground",
    messages: conversation.messages.map((message) => {
      const role = String(message.role)
      return {
        ...message,
        role: role === "user" || role === "assistant" ? role : role === "USER" ? "user" : "assistant",
        confidence: message.confidence ?? message.confidenceScore,
      }
    }),
  })
}
