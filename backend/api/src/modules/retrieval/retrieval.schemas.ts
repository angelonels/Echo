import { z } from "zod";

export const retrievalChannelSchema = z.enum(["playground", "widget", "internal_eval"]);

export const retrievalRequestSchema = z.object({
  query: z.string().trim().min(1).max(4000),
  userId: z.string().uuid(),
  agentId: z.string().uuid(),
  channel: retrievalChannelSchema,
});
