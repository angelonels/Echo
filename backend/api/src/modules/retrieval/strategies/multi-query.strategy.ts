import { RETRIEVAL_LIMITS } from "../constants/retrieval.js";
import type { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";
import type { VectorSearchRepository } from "../interfaces/VectorSearchRepository.js";
import type { RetrievedChunk } from "../types/retrieval.js";

export async function runMultiQueryRetrieval(input: {
  userId: string;
  agentId: string;
  queries: string[];
  embeddingProvider: EmbeddingProvider;
  vectorSearchRepository: VectorSearchRepository;
}): Promise<RetrievedChunk[]> {
  const lists = await Promise.all(
    input.queries.map(async (query) => {
      const embedding = await input.embeddingProvider.embedQuery(query);
      return input.vectorSearchRepository.hybridSearch({
        userId: input.userId,
        agentId: input.agentId,
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

  return Array.from(merged.values())
    .sort((left, right) => right.combinedScore - left.combinedScore)
    .slice(0, RETRIEVAL_LIMITS.naiveTopK)
    .map((chunk, index) => ({ ...chunk, rank: index + 1 }));
}
