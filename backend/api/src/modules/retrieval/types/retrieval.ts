export type RetrievalStrategy = "NAIVE_RAG" | "MULTI_QUERY" | "FALLBACK";

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  companyId: string;
  agentId: string;
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
  companyId: string;
  agentId: string;
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
  shouldFallback: boolean;
  expandedQueries: string[];
  classification: QueryClassification;
};
