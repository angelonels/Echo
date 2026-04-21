import { END, START, StateGraph } from "@langchain/langgraph";
import { RETRIEVAL_LIMITS } from "../constants/retrieval.js";
import type { ChatModelProvider } from "../interfaces/ChatModelProvider.js";
import type { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import type { VectorSearchRepository } from "../interfaces/VectorSearchRepository.js";
import { RetrievalGraphState, type RetrievalGraphStateType } from "./state.js";
import type { RetrievalRequest, RetrievalResponse, RetrievedChunk } from "../types/retrieval.js";
import {
  classifyQuery,
  expandQueries,
  normalizeInput,
  pickStrategy,
  scoreConfidence,
  shouldFallback,
} from "../services/retrievalHeuristics.js";

interface RetrievalOrchestratorDeps {
  embeddingProvider: EmbeddingProvider;
  chatModelProvider: ChatModelProvider;
  vectorSearchRepository: VectorSearchRepository;
}

export class RetrievalOrchestrator {
  private readonly graph;

  constructor(private readonly deps: RetrievalOrchestratorDeps) {
    this.graph = this.buildGraph().compile();
  }

  async run(request: RetrievalRequest): Promise<RetrievalResponse> {
    const finalState = await this.graph.invoke({
      rawInput: request.query,
      companyId: request.companyId,
      agentId: request.agentId,
      conversation: request.conversation.slice(-6),
    });

    return {
      strategy: finalState.strategy,
      confidence: finalState.confidence,
      context: finalState.retrievedChunks.slice(0, RETRIEVAL_LIMITS.finalContextChunks).map((chunk: RetrievedChunk) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        content: chunk.content,
        rank: chunk.rank,
        score: chunk.combinedScore,
      })),
      answer: finalState.finalAnswer,
      shouldFallback: finalState.shouldFallback,
      expandedQueries: finalState.expandedQueries,
      classification: finalState.classification,
    };
  }

  private buildGraph() {
    return new StateGraph(RetrievalGraphState)
      .addNode("normalizeInput", this.normalizeInputNode)
      .addNode("classifyQuery", this.classifyQueryNode)
      .addNode("initialRecallProbe", this.initialRecallProbeNode)
      .addNode("naiveRetrieve", this.naiveRetrieveNode)
      .addNode("expandQueries", this.expandQueriesNode)
      .addNode("multiRetrieveAndMerge", this.multiRetrieveAndMergeNode)
      .addNode("buildContext", this.buildContextNode)
      .addNode("generateDraftAnswer", this.generateDraftAnswerNode)
      .addNode("scoreConfidence", this.scoreConfidenceNode)
      .addNode("fallbackDecision", this.fallbackDecisionNode)
      .addNode("finalizeAnswer", this.finalizeAnswerNode)
      .addNode("fallbackResponder", this.fallbackResponderNode)
      .addEdge(START, "normalizeInput")
      .addEdge("normalizeInput", "classifyQuery")
      .addEdge("classifyQuery", "initialRecallProbe")
      .addConditionalEdges("initialRecallProbe", this.strategyRouterNode)
      .addEdge("naiveRetrieve", "buildContext")
      .addEdge("expandQueries", "multiRetrieveAndMerge")
      .addEdge("multiRetrieveAndMerge", "buildContext")
      .addEdge("buildContext", "generateDraftAnswer")
      .addEdge("generateDraftAnswer", "scoreConfidence")
      .addEdge("scoreConfidence", "fallbackDecision")
      .addConditionalEdges("fallbackDecision", (state: RetrievalGraphStateType) =>
        state.shouldFallback ? "fallbackResponder" : "finalizeAnswer",
      )
      .addEdge("finalizeAnswer", END)
      .addEdge("fallbackResponder", END);
  }

  private normalizeInputNode = async (state: RetrievalGraphStateType) => ({
    normalizedQuery: normalizeInput(state.rawInput),
    conversation: state.conversation.slice(-6),
  });

  private classifyQueryNode = async (state: RetrievalGraphStateType) => ({
    classification: classifyQuery(state.normalizedQuery),
  });

  private initialRecallProbeNode = async (state: RetrievalGraphStateType) => {
    const embedding = await this.deps.embeddingProvider.embedQuery(state.normalizedQuery);
    const probeResults = await this.deps.vectorSearchRepository.hybridSearch({
      companyId: state.companyId,
      agentId: state.agentId,
      query: state.normalizedQuery,
      embedding,
      limit: RETRIEVAL_LIMITS.initialProbe,
    });

    return { probeResults };
  };

  private strategyRouterNode = (state: RetrievalGraphStateType) => {
    const { confidence } = scoreConfidence(state.probeResults);
    const strategy = pickStrategy(state.classification, confidence, state.probeResults.length);
    return strategy === "NAIVE_RAG" ? "naiveRetrieve" : strategy === "MULTI_QUERY" ? "expandQueries" : "fallbackResponder";
  };

  private naiveRetrieveNode = async (state: RetrievalGraphStateType) => {
    const embedding = await this.deps.embeddingProvider.embedQuery(state.normalizedQuery);
    const retrievedChunks = await this.deps.vectorSearchRepository.hybridSearch({
      companyId: state.companyId,
      agentId: state.agentId,
      query: state.normalizedQuery,
      embedding,
      limit: RETRIEVAL_LIMITS.naiveTopK,
    });

    return { strategy: "NAIVE_RAG" as const, retrievedChunks, expandedQueries: [state.normalizedQuery] };
  };

  private expandQueriesNode = async (state: RetrievalGraphStateType) => ({
    strategy: "MULTI_QUERY" as const,
    expandedQueries: expandQueries(state.normalizedQuery),
  });

  private multiRetrieveAndMergeNode = async (state: RetrievalGraphStateType) => {
    const lists = await Promise.all(
      state.expandedQueries.map(async (query: string) => {
        const embedding = await this.deps.embeddingProvider.embedQuery(query);
        return this.deps.vectorSearchRepository.hybridSearch({
          companyId: state.companyId,
          agentId: state.agentId,
          query,
          embedding,
          limit: RETRIEVAL_LIMITS.multiQueryTopKPerQuery,
        });
      }),
    );

    const merged = new Map<string, RetrievedChunk>();
    for (const list of lists) {
      for (const chunk of list) {
        const existing = merged.get(chunk.chunkId);
        if (!existing || existing.combinedScore < chunk.combinedScore) {
          merged.set(chunk.chunkId, chunk);
        }
      }
    }

    const retrievedChunks = Array.from(merged.values())
      .sort((left, right) => right.combinedScore - left.combinedScore)
      .slice(0, RETRIEVAL_LIMITS.naiveTopK)
      .map((chunk: RetrievedChunk, index: number) => ({ ...chunk, rank: index + 1 }));

    return { retrievedChunks };
  };

  private buildContextNode = async (state: RetrievalGraphStateType) => {
    const source = state.retrievedChunks.length > 0 ? state.retrievedChunks : state.probeResults;
    const contextText = source
      .slice(0, RETRIEVAL_LIMITS.finalContextChunks)
      .map(
        (chunk: RetrievedChunk, index: number) =>
          `Context ${index + 1} [doc=${chunk.documentId} score=${chunk.combinedScore.toFixed(3)}]\n${chunk.content}`,
      )
      .join("\n\n---\n\n");

    return {
      retrievedChunks: source,
      contextText,
    };
  };

  private generateDraftAnswerNode = async (state: RetrievalGraphStateType) => {
    if (!state.contextText) {
      return { draftAnswer: "" };
    }

    const prompt = `You are Echo, a customer support retrieval assistant.
Use only the supplied context. If the context is insufficient, reply exactly with: "I do not have enough context from the uploaded documents to answer that safely."

Conversation:
${state.conversation.map((turn: { role: string; content: string }) => `${turn.role}: ${turn.content}`).join("\n")}

Question:
${state.normalizedQuery}

Context:
${state.contextText}`;

    const draftAnswer = await this.deps.chatModelProvider.generateText(prompt);
    return { draftAnswer: draftAnswer.trim() };
  };

  private scoreConfidenceNode = async (state: RetrievalGraphStateType) => {
    const { confidence, breakdown } = scoreConfidence(state.retrievedChunks);
    return { confidence, confidenceBreakdown: breakdown };
  };

  private fallbackDecisionNode = async (state: RetrievalGraphStateType) => ({
    shouldFallback:
      state.strategy === "FALLBACK" ||
      state.retrievedChunks.length === 0 ||
      shouldFallback(state.confidence, state.draftAnswer),
  });

  private finalizeAnswerNode = async (state: RetrievalGraphStateType) => ({
    finalAnswer: state.draftAnswer,
    shouldFallback: false,
  });

  private fallbackResponderNode = async () => ({
    strategy: "FALLBACK" as const,
    shouldFallback: true,
    finalAnswer:
      "I could not verify the answer from this agent’s uploaded documents, so I should not guess. Please upload or point me to the relevant document and try again.",
  });
}
