import { Annotation } from "@langchain/langgraph";
import type { QueryClassification, RetrievedChunk, RetrievalStrategy } from "../types/retrieval.js";

export const RetrievalGraphState = Annotation.Root({
  rawInput: Annotation<string>(),
  normalizedQuery: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => "",
  }),
  userId: Annotation<string>(),
  agentId: Annotation<string>(),
  channel: Annotation<"playground" | "widget" | "internal_eval">({
    reducer: (_previous, next) => next,
    default: () => "playground",
  }),
  conversation: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
    reducer: (_previous, next) => next,
    default: () => [],
  }),
  classification: Annotation<QueryClassification>({
    reducer: (_previous, next) => next,
    default: () => ({
      intent: "FACT_LOOKUP",
      requiresBroaderSearch: false,
      mentionsTroubleshooting: false,
      containsIdentifier: false,
    }),
  }),
  probeResults: Annotation<RetrievedChunk[]>({
    reducer: (_previous, next) => next,
    default: () => [],
  }),
  strategy: Annotation<RetrievalStrategy>({
    reducer: (_previous, next) => next,
    default: () => "fallback",
  }),
  expandedQueries: Annotation<string[]>({
    reducer: (_previous, next) => next,
    default: () => [],
  }),
  retrievedChunks: Annotation<RetrievedChunk[]>({
    reducer: (_previous, next) => next,
    default: () => [],
  }),
  contextText: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => "",
  }),
  draftAnswer: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => "",
  }),
  confidence: Annotation<number>({
    reducer: (_previous, next) => next,
    default: () => 0,
  }),
  confidenceBreakdown: Annotation<Record<string, number>>({
    reducer: (_previous, next) => next,
    default: () => ({}),
  }),
  shouldFallback: Annotation<boolean>({
    reducer: (_previous, next) => next,
    default: () => false,
  }),
  finalAnswer: Annotation<string>({
    reducer: (_previous, next) => next,
    default: () => "",
  }),
});

export type RetrievalGraphStateType = typeof RetrievalGraphState.State;
