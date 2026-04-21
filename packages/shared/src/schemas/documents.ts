import { z } from "zod";
import { uploadMimeTypes } from "../constants/common.js";

export const uploadDocumentSchema = z.object({
  mimetype: z.enum(uploadMimeTypes),
  originalname: z.string().min(1),
  companyId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
});
