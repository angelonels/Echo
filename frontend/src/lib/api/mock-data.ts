import type {
  AgentDetail,
  AgentSummary,
  AnalyticsSummary,
  Company,
  ConversationSummary,
  DocumentRecord,
  PlaygroundConversation,
  PlaygroundMessage,
  TopQuestion,
  User,
  WidgetConfig,
} from "@/lib/api/schemas"

export const mockUser: User = {
  id: "usr_echo_owner",
  companyId: "cmp_northstar",
  email: "ops@northstarhvac.com",
  fullName: "Maya Patel",
  role: "OWNER",
}

export const mockCompany: Company = {
  id: "cmp_northstar",
  name: "Northstar HVAC",
  slug: "northstar-hvac",
}

export const mockAgents: AgentSummary[] = [
  {
    id: "agt_support_core",
    name: "Support Command",
    publicAgentKey: "echo_pub_support_core",
    isActive: true,
    documentCount: 18,
    conversationCount: 412,
    updatedAt: "2026-04-22T10:15:00.000Z",
  },
  {
    id: "agt_aftercare",
    name: "Aftercare Assistant",
    publicAgentKey: "echo_pub_aftercare",
    isActive: true,
    documentCount: 9,
    conversationCount: 131,
    updatedAt: "2026-04-21T15:45:00.000Z",
  },
  {
    id: "agt_installations",
    name: "Install Desk",
    publicAgentKey: "echo_pub_install_desk",
    isActive: false,
    documentCount: 4,
    conversationCount: 28,
    updatedAt: "2026-04-20T12:20:00.000Z",
  },
]

export const mockAgentDetails: Record<string, AgentDetail> = {
  agt_support_core: {
    id: "agt_support_core",
    name: "Support Command",
    description:
      "Primary customer support agent for warranty, scheduling, and order questions.",
    publicAgentKey: "echo_pub_support_core",
    greetingMessage:
      "Hi, I am Echo for Northstar HVAC. I can help with service windows, warranty terms, and installation questions.",
    primaryColor: "#11b5a4",
    launcherPosition: "right",
    allowedDomains: ["northstarhvac.com", "help.northstarhvac.com"],
    isActive: true,
  },
  agt_aftercare: {
    id: "agt_aftercare",
    name: "Aftercare Assistant",
    description:
      "Focused on maintenance plans, post-installation care, and parts guidance.",
    publicAgentKey: "echo_pub_aftercare",
    greetingMessage:
      "Welcome back. Ask about service plans, follow-up maintenance, or replacement parts.",
    primaryColor: "#0f8cf0",
    launcherPosition: "right",
    allowedDomains: ["northstarhvac.com"],
    isActive: true,
  },
  agt_installations: {
    id: "agt_installations",
    name: "Install Desk",
    description:
      "Pre-sales and installation planning agent for quote readiness and technician prep.",
    publicAgentKey: "echo_pub_install_desk",
    greetingMessage:
      "I can help your team answer installation scope, timelines, and site requirements.",
    primaryColor: "#f59e0b",
    launcherPosition: "left",
    allowedDomains: ["partners.northstarhvac.com"],
    isActive: false,
  },
}

export const mockDocuments: Record<string, DocumentRecord[]> = {
  agt_support_core: [
    {
      id: "doc_001",
      fileName: "warranty-policy-2026.pdf",
      mimeType: "application/pdf",
      sizeBytes: 284032,
      status: "READY",
      createdAt: "2026-04-20T08:30:00.000Z",
      updatedAt: "2026-04-20T08:37:00.000Z",
      versionGroupKey: "warranty-policy",
      errorMessage: null,
    },
    {
      id: "doc_002",
      fileName: "service-scheduling-playbook.md",
      mimeType: "text/markdown",
      sizeBytes: 88430,
      status: "PROCESSING",
      createdAt: "2026-04-22T09:05:00.000Z",
      updatedAt: "2026-04-22T09:08:00.000Z",
      versionGroupKey: "scheduling-playbook",
      errorMessage: null,
    },
    {
      id: "doc_003",
      fileName: "return-parts-policy.txt",
      mimeType: "text/plain",
      sizeBytes: 12480,
      status: "FAILED",
      createdAt: "2026-04-18T11:20:00.000Z",
      updatedAt: "2026-04-18T11:24:00.000Z",
      versionGroupKey: "parts-policy",
      errorMessage: "Parser could not detect a stable text encoding.",
    },
  ],
  agt_aftercare: [
    {
      id: "doc_004",
      fileName: "maintenance-plan-faq.pdf",
      mimeType: "application/pdf",
      sizeBytes: 194220,
      status: "READY",
      createdAt: "2026-04-17T07:14:00.000Z",
      updatedAt: "2026-04-17T07:18:00.000Z",
      versionGroupKey: "maintenance-plan",
      errorMessage: null,
    },
  ],
  agt_installations: [],
}

export const mockConversations: Record<string, PlaygroundConversation> = {
  agt_support_core: {
    id: "con_support_preview",
    source: "PLAYGROUND",
    messages: [
      {
        id: "msg_1",
        role: "USER",
        content: "Do you cover compressor replacements under warranty?",
        createdAt: "2026-04-22T10:00:00.000Z",
      },
      {
        id: "msg_2",
        role: "ASSISTANT",
        content:
          "Yes. Compressor replacement is covered in years 1 to 5 when annual maintenance records are present. Labor is only included during the first 12 months.",
        confidenceScore: 0.93,
        retrievalStrategy: "MULTI_QUERY",
        createdAt: "2026-04-22T10:00:02.000Z",
      },
    ],
  },
}

export const mockTopQuestions: Record<string, TopQuestion[]> = {
  agt_support_core: [
    { question: "How long is the parts warranty?", count: 54 },
    { question: "Can I reschedule a technician visit?", count: 41 },
    { question: "Where do I upload proof of purchase?", count: 26 },
    { question: "Do you service commercial units?", count: 18 },
  ],
  agt_aftercare: [
    { question: "What is included in the premium plan?", count: 19 },
    { question: "How often should filters be replaced?", count: 17 },
  ],
  agt_installations: [],
}

export const mockAnalyticsSummary: Record<string, AnalyticsSummary> = {
  agt_support_core: {
    totalConversations: 320,
    totalMessages: 1480,
    fallbackRate: 0.12,
    avgConfidence: 0.81,
    sentiment: {
      positive: 180,
      neutral: 102,
      negative: 38,
    },
  },
  agt_aftercare: {
    totalConversations: 114,
    totalMessages: 406,
    fallbackRate: 0.08,
    avgConfidence: 0.87,
    sentiment: {
      positive: 72,
      neutral: 29,
      negative: 13,
    },
  },
  agt_installations: {
    totalConversations: 18,
    totalMessages: 62,
    fallbackRate: 0.18,
    avgConfidence: 0.75,
    sentiment: {
      positive: 9,
      neutral: 6,
      negative: 3,
    },
  },
}

export const mockConversationSummaries: Record<string, ConversationSummary[]> = {
  agt_support_core: [
    {
      id: "con_001",
      source: "WIDGET",
      startedAt: "2026-04-22T08:10:00.000Z",
      lastMessageAt: "2026-04-22T08:14:00.000Z",
      messageCount: 6,
      avgConfidence: 0.87,
      sentimentLabel: "POSITIVE",
    },
    {
      id: "con_002",
      source: "PLAYGROUND",
      startedAt: "2026-04-22T09:22:00.000Z",
      lastMessageAt: "2026-04-22T09:24:00.000Z",
      messageCount: 4,
      avgConfidence: 0.78,
      sentimentLabel: "NEUTRAL",
    },
    {
      id: "con_003",
      source: "WIDGET",
      startedAt: "2026-04-22T09:38:00.000Z",
      lastMessageAt: "2026-04-22T09:41:00.000Z",
      messageCount: 5,
      avgConfidence: 0.62,
      sentimentLabel: "NEGATIVE",
    },
  ],
  agt_aftercare: [
    {
      id: "con_004",
      source: "WIDGET",
      startedAt: "2026-04-21T16:10:00.000Z",
      lastMessageAt: "2026-04-21T16:11:00.000Z",
      messageCount: 3,
      avgConfidence: 0.9,
      sentimentLabel: "POSITIVE",
    },
  ],
  agt_installations: [],
}

export const mockWidgetConfigs: Record<string, WidgetConfig> = {
  agt_support_core: {
    agentName: "Support Command",
    greetingMessage:
      "Hi, I am Echo for Northstar HVAC. Ask about service windows, warranty terms, and technician visits.",
    theme: {
      primaryColor: "#11b5a4",
      position: "right",
    },
  },
  agt_aftercare: {
    agentName: "Aftercare Assistant",
    greetingMessage:
      "Welcome back. I can answer maintenance and support plan questions.",
    theme: {
      primaryColor: "#0f8cf0",
      position: "right",
    },
  },
  agt_installations: {
    agentName: "Install Desk",
    greetingMessage: "Ask about quotes, site readiness, and installation planning.",
    theme: {
      primaryColor: "#f59e0b",
      position: "left",
    },
  },
}

export function buildAssistantReply(message: string): PlaygroundMessage {
  const normalized = message.toLowerCase()

  let content =
    "I found the strongest matching policy excerpt and answered using the current agent documents."
  let confidenceScore = 0.82
  let retrievalStrategy = "MULTI_QUERY"

  if (normalized.includes("warranty")) {
    content =
      "Warranty coverage is document-backed. Parts are covered for five years, labor for the first year, and proof of annual maintenance is required for compressor claims."
    confidenceScore = 0.93
  } else if (normalized.includes("schedule") || normalized.includes("appointment")) {
    content =
      "Customers can reschedule up to 24 hours before the visit through the support portal or by replying to the service confirmation email."
    confidenceScore = 0.88
    retrievalStrategy = "NAIVE_RAG"
  } else if (normalized.includes("order")) {
    content =
      "The current knowledge base does not expose live order data. Echo should direct the customer to the order tracker and escalate to an agent if the package status has not changed in 48 hours."
    confidenceScore = 0.71
    retrievalStrategy = "FALLBACK"
  }

  return {
    id: `msg_${Math.random().toString(36).slice(2, 8)}`,
    role: "ASSISTANT",
    content,
    confidenceScore,
    retrievalStrategy,
    createdAt: new Date().toISOString(),
  }
}
