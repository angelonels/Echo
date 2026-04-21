import type { RetrievedChunk } from "../types/retrieval.js";

export interface HybridSearchParams {
  companyId: string;
  agentId: string;
  query: string;
  embedding: number[];
  limit: number;
}

export interface PersistChunkParams {
  documentId: string;
  companyId: string;
  agentId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  metadata?: Record<string, unknown>;
}

export interface VectorSearchRepository {
  hybridSearch(params: HybridSearchParams): Promise<RetrievedChunk[]>;
  replaceDocumentChunks(documentId: string, chunks: PersistChunkParams[]): Promise<void>;
}
