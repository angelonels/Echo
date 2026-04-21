import { z } from "zod"

import {
  agentDetailSchema,
  agentSummarySchema,
  analyticsSummarySchema,
  authLoginResponseSchema,
  authSignupResponseSchema,
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
  type AuthFormValues,
  type Company,
  type ConversationSummary,
  type CreateAgentValues,
  type DocumentRecord,
  type PlaygroundConversation,
  type PlaygroundChatResponse,
  type SignupFormValues,
  type TopQuestion,
  type User,
  type WidgetConfig,
} from "@/lib/api/schemas"
import {
  buildAssistantReply,
  mockAgentDetails,
  mockAgents,
  mockAnalyticsSummary,
  mockCompany,
  mockConversationSummaries,
  mockConversations,
  mockDocuments,
  mockTopQuestions,
  mockUser,
  mockWidgetConfigs,
} from "@/lib/api/mock-data"

const apiBaseUrl = process.env.NEXT_PUBLIC_ECHO_API_URL

type SourceTagged<T> = T & { source: "api" | "mock" }

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
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
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

export async function signup(
  values: SignupFormValues
): Promise<SourceTagged<{ user: User; company: Company; redirectTo: string }>> {
  const response = await request(
    "/api/v1/auth/signup",
    authSignupResponseSchema,
    {
      user: mockUser,
      company: mockCompany,
      tokens: {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    },
    {
      method: "POST",
      body: JSON.stringify(values),
    }
  )

  return {
    user: response.user,
    company: response.company,
    redirectTo: "/dashboard",
    source: response.source,
  }
}

export async function login(
  values: AuthFormValues
): Promise<SourceTagged<{ user: User; redirectTo: string }>> {
  const response = await request(
    "/api/v1/auth/login",
    authLoginResponseSchema,
    {
      user: mockUser,
      tokens: {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    },
    {
      method: "POST",
      body: JSON.stringify(values),
    }
  )

  return {
    user: response.user,
    redirectTo: "/dashboard",
    source: response.source,
  }
}

export async function getAgents(): Promise<SourceTagged<{ items: AgentSummary[] }>> {
  return request(
    "/api/v1/agents",
    z.object({ items: z.array(agentSummarySchema) }),
    { items: mockAgents }
  )
}

export async function getAgent(agentId: string): Promise<SourceTagged<AgentDetail>> {
  const fallback = mockAgentDetails[agentId] ?? mockAgentDetails[mockAgents[0].id]
  return request(`/api/v1/agents/${agentId}`, agentDetailSchema, fallback)
}

export async function createAgent(
  values: CreateAgentValues
): Promise<SourceTagged<AgentDetail>> {
  const payload = createAgentSchema.parse(values)
  const fallback: AgentDetail = {
    id: "agt_new_launchpad",
    publicAgentKey: "echo_pub_new_launchpad",
    allowedDomains: [],
    isActive: true,
    ...payload,
  }

  return request("/api/v1/agents", agentDetailSchema, fallback, {
    method: "POST",
    body: JSON.stringify(values),
  })
}

export async function updateAgent(
  agentId: string,
  values: Partial<CreateAgentValues>
): Promise<SourceTagged<AgentDetail>> {
  const fallback = {
    ...(mockAgentDetails[agentId] ?? mockAgentDetails[mockAgents[0].id]),
    ...values,
  }

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
    { items: mockDocuments[agentId] ?? [] }
  )
}

export async function uploadDocument(
  agentId: string,
  file: File
): Promise<SourceTagged<{ document: DocumentRecord }>> {
  if (!apiBaseUrl) {
    return {
      document: {
        id: `doc_${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        status: "UPLOADED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versionGroupKey: null,
        errorMessage: null,
      },
      source: "mock",
    }
  }

  const formData = new FormData()
  formData.append("file", file)

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/agents/${agentId}/documents`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}`)
    }

    const data = await response.json()
    const document = documentSchema.parse(data.document)
    return { document, source: "api" }
  } catch {
    return {
      document: {
        id: `doc_${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        status: "UPLOADED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versionGroupKey: null,
        errorMessage: null,
      },
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
    mockConversations[agentId] ?? mockConversations[mockAgents[0].id]
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
    message: assistant,
    meta: {
      retrievalStrategy: assistant.retrievalStrategy ?? "MULTI_QUERY",
      fallbackUsed: (assistant.retrievalStrategy ?? "MULTI_QUERY") === "FALLBACK",
      latencyMs: 1180,
    },
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
  const detail = mockAgentDetails[agentId] ?? mockAgentDetails[mockAgents[0].id]
  return request(
    `/api/v1/widget/config/${agentKey ?? detail.publicAgentKey}`,
    widgetConfigSchema,
    mockWidgetConfigs[agentId] ?? mockWidgetConfigs[mockAgents[0].id]
  )
}

export async function getDashboardSnapshot() {
  const [agents, summary] = await Promise.all([
    getAgents(),
    getAnalyticsSummary(mockAgents[0].id),
  ])

  return {
    agents,
    summary,
    company: mockCompany,
    currentUser: mockUser,
  }
}
