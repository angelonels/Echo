import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_DB: z.string().default("echodb"),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("password"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  UPLOAD_ROOT: z.string().default("./uploads"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MAX_DOCUMENTS_PER_AGENT: z.coerce.number().int().positive().default(20),
  MAX_EXTRACTED_CHARACTERS: z.coerce.number().int().positive().default(500_000),
  MAX_CHUNKS_PER_DOCUMENT: z.coerce.number().int().positive().default(1_000),
  EMBEDDING_DIMENSION: z.coerce.number().int().positive().default(1024),
  DEFAULT_GENERATION_MODEL: z.string().default("amazon.nova-lite-v1:0"),
  DEFAULT_EMBEDDING_MODEL: z.string().default("amazon.titan-embed-text-v2:0"),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_JWT_KEY: z.string().optional(),
  CLERK_AUTHORIZED_PARTIES: z.string().optional(),
  ENABLE_DEV_AUTH: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  AWS_DEFAULT_REGION: z.string().default("ap-south-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
