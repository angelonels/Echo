import { RETRIEVAL_LIMITS, ROUTING_THRESHOLDS } from "../constants/retrieval.js";
import type {
  QueryClassification,
  RetrievedChunk,
  RetrievalConfidenceBreakdown,
  RetrievalStrategy,
} from "../types/retrieval.js";

const TROUBLESHOOTING_TERMS = ["error", "issue", "problem", "failing", "failed", "not working", "unable"];
const PROCEDURAL_TERMS = ["how", "steps", "setup", "configure", "install", "enable", "disable"];
const IDENTIFIER_PATTERN = /\b[A-Z]{2,}[-_][A-Z0-9-]+\b|\b\d{3,}\b/;

export function normalizeInput(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}

export function classifyQuery(query: string): QueryClassification {
  const lowered = query.toLowerCase();
  const mentionsTroubleshooting = TROUBLESHOOTING_TERMS.some((term) => lowered.includes(term));
  const procedural = PROCEDURAL_TERMS.some((term) => lowered.includes(term));
  const containsIdentifier = IDENTIFIER_PATTERN.test(query);
  const requiresBroaderSearch = mentionsTroubleshooting || procedural || query.split(/\s+/).length > 10;

  return {
    intent: mentionsTroubleshooting ? "TROUBLESHOOTING" : procedural ? "PROCEDURAL" : "FACT_LOOKUP",
    requiresBroaderSearch,
    mentionsTroubleshooting,
    containsIdentifier,
  };
}

export function expandQueries(baseQuery: string): string[] {
  const normalized = normalizeInput(baseQuery);
  const lowered = normalized.toLowerCase();
  const queries = new Set<string>([normalized]);

  if (lowered.includes("error")) {
    queries.add(`${normalized} troubleshooting`);
    queries.add(`${normalized} root cause`);
  }

  if (lowered.includes("how") || lowered.includes("setup")) {
    queries.add(`${normalized} steps`);
    queries.add(`${normalized} guide`);
  }

  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token.length > 3)
    .slice(0, RETRIEVAL_LIMITS.multiQueryVariants - 1);

  if (tokens.length > 0) {
    queries.add(tokens.join(" "));
  }

  return Array.from(queries).slice(0, RETRIEVAL_LIMITS.multiQueryVariants);
}

export function scoreConfidence(results: RetrievedChunk[]): {
  confidence: number;
  breakdown: RetrievalConfidenceBreakdown;
} {
  if (results.length === 0) {
    return {
      confidence: 0,
      breakdown: {
        topScore: 0,
        averageTopScore: 0,
        lexicalCoverage: 0,
        semanticCoverage: 0,
        resultCountScore: 0,
        diversityScore: 0,
      },
    };
  }

  const topResults = results.slice(0, 4);
  const topScore = clamp(topResults[0]?.combinedScore ?? 0);
  const averageTopScore = clamp(topResults.reduce((sum, item) => sum + item.combinedScore, 0) / topResults.length);
  const lexicalCoverage = clamp(topResults.reduce((sum, item) => sum + item.lexicalScore, 0) / topResults.length);
  const semanticCoverage = clamp(topResults.reduce((sum, item) => sum + item.semanticScore, 0) / topResults.length);
  const resultCountScore = clamp(results.length / RETRIEVAL_LIMITS.naiveTopK);
  const diversityScore = clamp(new Set(results.slice(0, 6).map((item) => item.documentId)).size / 3);

  const confidence = clamp(
    topScore * 0.34 +
      averageTopScore * 0.24 +
      lexicalCoverage * 0.14 +
      semanticCoverage * 0.14 +
      resultCountScore * 0.08 +
      diversityScore * 0.06,
  );

  return {
    confidence,
    breakdown: {
      topScore,
      averageTopScore,
      lexicalCoverage,
      semanticCoverage,
      resultCountScore,
      diversityScore,
    },
  };
}

export function pickStrategy(
  classification: QueryClassification,
  confidence: number,
  resultCount: number,
): RetrievalStrategy {
  if (confidence < ROUTING_THRESHOLDS.fallbackMinConfidence || resultCount === 0) {
    return "FALLBACK";
  }

  if (
    !classification.requiresBroaderSearch &&
    confidence >= ROUTING_THRESHOLDS.naiveMinConfidence &&
    resultCount >= RETRIEVAL_LIMITS.lowResultCountThreshold
  ) {
    return "NAIVE_RAG";
  }

  if (confidence >= ROUTING_THRESHOLDS.multiQueryMinConfidence) {
    return "MULTI_QUERY";
  }

  return "FALLBACK";
}

export function shouldFallback(confidence: number, answer: string): boolean {
  const normalizedAnswer = answer.trim().toLowerCase();
  const isEmpty = normalizedAnswer.length === 0;
  const looksHedged = normalizedAnswer.includes("not enough context") || normalizedAnswer.includes("cannot verify");
  return isEmpty || looksHedged || confidence < ROUTING_THRESHOLDS.minAnswerConfidence;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
