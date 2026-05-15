import type { EvalCase } from "./dataset-loader.js";
import type { EvalThresholds } from "./eval-config.js";

export type EvalCaseResult = {
  caseId: string;
  question: string;
  answer: string;
  responseType: "grounded_answer" | "clarifying_question" | "fallback" | "unsafe_request_blocked" | "error";
  passed: boolean;
  metrics: {
    requiredSourceHit: boolean;
    faithfulness: number;
    answerRelevance: number;
    contextPrecision: number;
    contextRecall: number;
    fallbackCorrect: boolean;
    citationCorrect: boolean;
    latencyMs: number;
    estimatedCostUsd: number;
  };
  failureReason: string | null;
  retrievedSources: string[];
  warnings: string[];
};

export function scorePlaceholderCase(testCase: EvalCase, thresholds: EvalThresholds): EvalCaseResult {
  const fallbackCorrect = testCase.shouldFallback;
  const metrics = {
    requiredSourceHit: testCase.requiredSources.length === 0,
    faithfulness: 0,
    answerRelevance: 0,
    contextPrecision: 0,
    contextRecall: 0,
    fallbackCorrect,
    citationCorrect: false,
    latencyMs: 0,
    estimatedCostUsd: 0,
  };

  return {
    caseId: testCase.id,
    question: testCase.question,
    answer: "",
    responseType: testCase.shouldFallback ? "fallback" : "error",
    passed:
      metrics.requiredSourceHit &&
      metrics.fallbackCorrect &&
      metrics.faithfulness >= thresholds.minFaithfulness &&
      metrics.answerRelevance >= thresholds.minAnswerRelevance &&
      metrics.contextPrecision >= thresholds.minContextPrecision,
    metrics,
    failureReason: "eval_runner_not_connected_to_retrieval_pipeline",
    retrievedSources: [],
    warnings: ["EVAL_PIPELINE_NOT_CONNECTED"],
  };
}
