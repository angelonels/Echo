import { z } from "zod";

export const chatRequestSchema = z.object({
  query: z.string().min(1, "Query must not be empty"),
  threadId: z.string().min(1, "Thread ID is required for memory persistence"),
  companyId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .optional(),
});
