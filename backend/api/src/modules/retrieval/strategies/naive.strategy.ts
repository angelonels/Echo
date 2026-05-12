import { RETRIEVAL_LIMITS } from "../constants/retrieval.js";
import type { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import type { VectorSearchRepository } from "../interfaces/VectorSearchRepository.js";
import type { RetrievedChunk } from "../types/retrieval.js";

export async function runNaiveRetrieval(input: {
  userId: string;
  agentId: string;
  query: string;
  embeddingProvider: EmbeddingProvider;
  vectorSearchRepository: VectorSearchRepository;
}): Promise<RetrievedChunk[]> {
  const embedding = await input.embeddingProvider.embedQuery(input.query);
  return input.vectorSearchRepository.hybridSearch({
    userId: input.userId,
    agentId: input.agentId,
    query: input.query,
    embedding,
    limit: RETRIEVAL_LIMITS.naiveTopK,
  });
}
