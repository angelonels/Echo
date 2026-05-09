import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  MAX_EXTRACTED_CHARACTERS: z.coerce.number().int().positive().default(500_000),
  MAX_CHUNKS_PER_DOCUMENT: z.coerce.number().int().positive().default(1_000),
  DEFAULT_EMBEDDING_MODEL: z.string().default("amazon.titan-embed-text-v2:0"),
  AWS_DEFAULT_REGION: z.string().default("ap-south-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
