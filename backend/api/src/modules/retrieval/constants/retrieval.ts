export const RETRIEVAL_LIMITS = {
  initialProbe: 4,
  naiveTopK: 8,
  finalContextChunks: 4,
  multiQueryVariants: 4,
  multiQueryTopKPerQuery: 4,
  lowResultCountThreshold: 2,
} as const;

export const ROUTING_THRESHOLDS = {
  naiveMinConfidence: 0.72,
  multiQueryMinConfidence: 0.12,
  fallbackMinConfidence: 0.1,
  minAnswerConfidence: 0.1,
} as const;
