export interface EmbeddingProvider {
  embedQuery(input: string): Promise<number[]>;
  embedDocuments(input: string[]): Promise<number[][]>;
}
