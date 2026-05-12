import { verifiedFallbackAnswer } from "../services/retrievalPrompts.js";

export function buildFallbackResult() {
  return {
    strategy: "fallback" as const,
    shouldFallback: true,
    finalAnswer: verifiedFallbackAnswer,
  };
}
