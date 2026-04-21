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
        company_id TEXT NOT NULL DEFAULT 'default-company',
        agent_id TEXT NOT NULL DEFAULT 'default-agent',
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'text/plain',
        storage_path TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'UPLOADED',
        processing_error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT 'default-company',
      ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'default-agent',
      ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'text/plain',
      ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'UPLOADED',
      ADD COLUMN IF NOT EXISTS processing_error TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        company_id TEXT NOT NULL DEFAULT 'default-company',
        agent_id TEXT NOT NULL DEFAULT 'default-agent',
        chunk_index TEXT NOT NULL DEFAULT '0',
        content TEXT NOT NULL,
        embedding vector(1024),
        metadata JSONB NOT NULL DEFAULT '{}',
        search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
      );
    `);

    await client.query(`
      ALTER TABLE knowledge_chunks
      ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT 'default-company',
      ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'default-agent',
      ADD COLUMN IF NOT EXISTS chunk_index TEXT NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx
      ON knowledge_chunks
      USING GIN (search_vector);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_scope_idx
      ON knowledge_chunks (company_id, agent_id, doc_id);
    `);
  } finally {
    client.release();
  }
}
