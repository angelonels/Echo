import type { RetrievalGraphStateType } from "../langgraph/state.js";
import type { RetrievedChunk } from "../types/retrieval.js";

export const verifiedFallbackAnswer =
  "I could not verify the answer from this agent's uploaded documents, so I should not guess. Please upload or point me to the relevant document and try again.";

export function buildContextText(chunks: RetrievedChunk[], limit: number) {
  return chunks
    .slice(0, limit)
    .map(
      (chunk, index) =>
        `Context ${index + 1} [doc=${chunk.documentId} score=${chunk.combinedScore.toFixed(3)}]\n${chunk.content}`,
    )
    .join("\n\n---\n\n");
}

export function buildGroundedAnswerPrompt(state: RetrievalGraphStateType) {
  return `You are Echo, a customer support retrieval assistant.
Use only the supplied context. If the context is insufficient, reply exactly with: "I do not have enough context from the uploaded documents to answer that safely."

Conversation:
${state.conversation.map((turn) => `${turn.role}: ${turn.content}`).join("\n")}

Question:
${state.normalizedQuery}

Context:
${state.contextText}`;
}
