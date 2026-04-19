import { z } from "zod";
import { AnalyticsPipelineStep } from "../constants/enums.js";

export const frictionSummarySchema = z.object({
  top_issues: z.array(
    z.object({
      name: z.string().min(1),
      count: z.number().int().nonnegative(),
    }),
  ),
  avg_sentiment: z.number(),
});

export const analyticsTriggerSchema = z.object({
  step: z.nativeEnum(AnalyticsPipelineStep).optional(),
});
