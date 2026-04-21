import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { env } from "../../../config/env.js";
import type { ChatModelProvider } from "../interfaces/ChatModelProvider.js";
import type { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";

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

function buildFallbackAnswer(prompt: string): string {
  const questionMatch = prompt.match(/Question:\n([\s\S]*?)\n\nContext:/);
  const contextMatch = prompt.match(/Context:\n([\s\S]*)$/);
  const question = questionMatch?.[1]?.trim() ?? "the question";
  const context = contextMatch?.[1]?.trim() ?? "";

  if (!context) {
    return "I do not have enough context from the uploaded documents to answer that safely.";
  }

  const snippets = context
    .split(/\n---\n|\n\n---\n\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk.replace(/^Context \d+ \[[^\]]+\]\n/, ""))
    .join(" ");

  return `Based on the uploaded documents, here is the best supported answer to "${question}": ${snippets}`.trim();
}

export class BedrockEmbeddingProvider implements EmbeddingProvider {
  private readonly client =
    credentials != null
      ? new BedrockEmbeddings({
          region: env.AWS_DEFAULT_REGION,
          credentials,
          model: "amazon.titan-embed-text-v2:0",
        })
      : null;

  async embedQuery(input: string): Promise<number[]> {
    if (!this.client) {
      return createDeterministicEmbedding(input);
    }

    try {
      return await this.client.embedQuery(input);
    } catch {
      return createDeterministicEmbedding(input);
    }
  }

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

export class BedrockChatModelProvider implements ChatModelProvider {
  private readonly client =
    credentials != null
      ? new ChatBedrockConverse({
          region: env.AWS_DEFAULT_REGION,
          credentials,
          model: "meta.llama3-8b-instruct-v1:0",
        })
      : null;

  async generateText(prompt: string): Promise<string> {
    if (!this.client) {
      return buildFallbackAnswer(prompt);
    }

    try {
      const response = await this.client.invoke(prompt);
      const content = Array.isArray(response.content)
        ? response.content
            .map((item) => ("text" in item && typeof item.text === "string" ? item.text : ""))
            .join("")
        : String(response.content ?? "");
      return content.trim() || buildFallbackAnswer(prompt);
    } catch {
      return buildFallbackAnswer(prompt);
    }
  }
}
