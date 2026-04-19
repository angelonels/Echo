import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { env } from "../config/env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function initDb() {
  const client = await pool.connect();

  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        user_query TEXT NOT NULL,
        agent_response TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS mapped_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        time_window TIMESTAMPTZ NOT NULL,
        friction_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daily_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_date DATE UNIQUE NOT NULL,
        top_issues JSONB NOT NULL,
        avg_sentiment FLOAT
      );

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL,
        storage_path TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(1024),
        search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx
      ON knowledge_chunks
      USING GIN (search_vector);
    `);
  } finally {
    client.release();
  }
}
