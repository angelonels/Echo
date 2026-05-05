import { z } from "zod";
import { uploadMimeTypes } from "../constants/common.js";

export const documentStatusSchema = z.enum([
  "uploaded",
  "extracting",
  "chunking",
  "embedding",
  "indexing",
  "ready",
  "failed",
]);

export const uploadDocumentSchema = z.object({
  mimetype: z.enum(uploadMimeTypes),
  originalname: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .refine((value) => !/[\\/]/.test(value), "Filename must not contain path separators."),
  size: z.number().int().positive().max(10 * 1024 * 1024).optional(),
  agentId: z.string().uuid().optional(),
});

export const documentDtoSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  originalFilename: z.string(),
  displayName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  status: documentStatusSchema,
  currentVersionId: z.string().uuid().nullable(),
  versionNumber: z.number().int().nullable(),
  chunkCount: z.number().int(),
  processingError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentDto = z.infer<typeof documentDtoSchema>;
