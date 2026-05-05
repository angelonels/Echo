import { z } from "zod";

export const conversationChannelSchema = z.enum(["playground", "widget"]);
export const messageRoleSchema = z.enum(["user", "assistant", "system", "tool"]);
export const responseTypeSchema = z.enum([
  "grounded_answer",
  "clarifying_question",
  "fallback",
  "unsafe_request_blocked",
]);

export const citationSchema = z.object({
  documentId: z.string().uuid(),
  documentTitle: z.string(),
  chunkId: z.string().uuid(),
  excerpt: z.string(),
});

export const playgroundChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});

export const playgroundChatResponseSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  answer: z.string(),
  responseType: responseTypeSchema,
  confidence: z.number().min(0).max(1),
  citations: z.array(citationSchema),
  traceId: z.string().uuid(),
  retrievalStrategy: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export type ConversationChannel = z.infer<typeof conversationChannelSchema>;
export type MessageRole = z.infer<typeof messageRoleSchema>;
export type PlaygroundChatResponse = z.infer<typeof playgroundChatResponseSchema>;
