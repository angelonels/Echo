export type EvalThresholds = {
  minFaithfulness: number;
  minAnswerRelevance: number;
  minContextPrecision: number;
  maxLatencyMs: number;
  maxAverageCostUsd: number;
};

export const defaultEvalThresholds: EvalThresholds = {
  minFaithfulness: 0.8,
  minAnswerRelevance: 0.75,
  minContextPrecision: 0.7,
  maxLatencyMs: 5000,
  maxAverageCostUsd: 0.05,
};
