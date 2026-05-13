export type RetrievalStrategy = "naive" | "multi_query" | "hybrid" | "fallback";
export type ResponseType = "grounded_answer" | "clarifying_question" | "fallback" | "unsafe_request_blocked";

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  userId: string;
  agentId: string;
  documentTitle: string;
  content: string;
  lexicalScore: number;
  semanticScore: number;
  combinedScore: number;
  rank: number;
  metadata: Record<string, unknown>;
};

export type QueryClassification = {
  intent: "FACT_LOOKUP" | "TROUBLESHOOTING" | "PROCEDURAL";
  requiresBroaderSearch: boolean;
  mentionsTroubleshooting: boolean;
  containsIdentifier: boolean;
};

export type RetrievalConfidenceBreakdown = {
  topScore: number;
  averageTopScore: number;
  lexicalCoverage: number;
  semanticCoverage: number;
  resultCountScore: number;
  diversityScore: number;
};

export type RetrievalRequest = {
  query: string;
  userId: string;
  agentId: string;
  channel: "playground" | "widget" | "internal_eval";
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
};

export type RetrievalResponse = {
  strategy: RetrievalStrategy;
  confidence: number;
  context: Array<{
    chunkId: string;
    documentId: string;
    content: string;
    rank: number;
    score: number;
  }>;
  answer: string;
  responseType: ResponseType;
  shouldFallback: boolean;
  citations: Array<{
    documentId: string;
    documentTitle: string;
    chunkId: string;
    excerpt: string;
  }>;
  selectedChunks: RetrievedChunk[];
  confidenceComponents: Record<string, number>;
  normalizedQuestion: string;
  expandedQueries: string[];
  classification: QueryClassification;
};
