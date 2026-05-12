import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { env } from "../../../config/env.js";
import type { ChatModelProvider } from "../interfaces/ChatModelProvider.js";
import type { EmbeddingProvider } from "../interfaces/EmbeddingProvider.js";

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

function createDeterministicEmbedding(input: string): number[] {
  const vector = new Array<number>(env.EMBEDDING_DIMENSION).fill(0);
  const normalized = input.toLowerCase();
  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);
    const slot = (code + index * 31) % env.EMBEDDING_DIMENSION;
    vector[slot] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export function buildGroundedFallbackAnswer(prompt: string): string {
  const questionMatch = prompt.match(/Question:\n([\s\S]*?)\n\nContext:/);
  const contextMatch = prompt.match(/Context:\n([\s\S]*)$/);
  const question = questionMatch?.[1]?.trim() ?? "the question";
  const context = contextMatch?.[1]?.trim() ?? "";

  if (!context) {
    return "I do not have enough context from the uploaded documents to answer that safely.";
  }

  const queryTerms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 2)

  const snippets = context
    .split(/\n---\n|\n\n---\n\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk.replace(/^Context \d+ \[[^\]]+\]\n/, ""))
    .flatMap((chunk) =>
      chunk
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean),
    )
    .map((sentence) => ({
      sentence,
      score: queryTerms.reduce(
        (total, term) => total + (sentence.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score)
    .filter((entry, index) => entry.score > 0 || index === 0)
    .slice(0, 2)
    .map((entry) => entry.sentence)
    .join(" ");

  return `Based on the uploaded documents, here is the best supported answer to "${question}": ${snippets}`.trim();
}

export class BedrockEmbeddingProvider implements EmbeddingProvider {
  private readonly client =
    credentials != null
      ? new BedrockEmbeddings({
          region: env.AWS_DEFAULT_REGION,
          credentials,
          model: env.DEFAULT_EMBEDDING_MODEL,
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
          model: env.DEFAULT_GENERATION_MODEL,
        })
      : null;

  async generateText(prompt: string): Promise<string> {
    if (!this.client) {
      return buildGroundedFallbackAnswer(prompt);
    }

    try {
      const response = await this.client.invoke(prompt);
      const content = Array.isArray(response.content)
        ? response.content
            .map((item) => ("text" in item && typeof item.text === "string" ? item.text : ""))
            .join("")
        : String(response.content ?? "");
      const normalized = content.trim();
      if (
        !normalized ||
        normalized.toLowerCase().includes("not enough context") ||
        normalized.toLowerCase().includes("cannot verify")
      ) {
        return buildGroundedFallbackAnswer(prompt);
      }

      return normalized;
    } catch {
      return buildGroundedFallbackAnswer(prompt);
    }
  }
}
