import { RetrievalOrchestrator } from "../modules/retrieval/langgraph/RetrievalOrchestrator.js";
import { BedrockChatModelProvider, BedrockEmbeddingProvider } from "../modules/retrieval/providers/bedrock.js";
import { PostgresVectorSearchRepository } from "../modules/retrieval/repositories/PostgresVectorSearchRepository.js";

export const embeddingProvider = new BedrockEmbeddingProvider();
export const chatModelProvider = new BedrockChatModelProvider();
export const vectorSearchRepository = new PostgresVectorSearchRepository();

export const retrievalOrchestrator = new RetrievalOrchestrator({
  embeddingProvider,
  chatModelProvider,
  vectorSearchRepository,
});
