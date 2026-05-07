import { z } from "zod";

export const widgetChatRequestSchema = z.object({
  agentKey: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  visitorId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(2000),
  page: z
    .object({
      url: z.string().url().optional(),
      title: z.string().max(200).optional(),
    })
    .optional(),
});

export const widgetFeedbackRequestSchema = z.object({
  agentKey: z.string().min(1),
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  rating: z.enum(["thumbs_up", "thumbs_down"]),
  comment: z.string().max(1000).optional(),
});
