import { BedrockEmbeddings } from "@langchain/aws";
import { env } from "../config/env.js";

const EMBEDDING_DIMENSIONS = 1024;

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

function createDeterministicEmbedding(input: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const normalized = input.toLowerCase();
  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    const slot = (code + index * 31) % EMBEDDING_DIMENSIONS;
    vector[slot] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export class EmbeddingService {
  private readonly client =
    credentials != null
      ? new BedrockEmbeddings({
          region: env.AWS_DEFAULT_REGION,
          credentials,
          model: "amazon.titan-embed-text-v2:0",
        })
      : null;

  async embedDocuments(input: string[]): Promise<number[][]> {
    if (!this.client) {
      return input.map(createDeterministicEmbedding);
    }

    try {
      return await this.client.embedDocuments(input);
    } catch {
      return input.map(createDeterministicEmbedding);
    }
  }
}
