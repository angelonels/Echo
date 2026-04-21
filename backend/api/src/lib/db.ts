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
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL DEFAULT 'default-company',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT 'default-company',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS organizations_slug_idx
      ON organizations (slug);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'OWNER',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_unique_idx
      ON admin_users (email);
    `);

    await client.query(`
      ALTER TABLE admin_users
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        greeting_message TEXT NOT NULL DEFAULT 'Hi, I''m Echo. How can I help?',
        primary_color TEXT NOT NULL DEFAULT '#11b5a4',
        launcher_position TEXT NOT NULL DEFAULT 'right',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        system_prompt TEXT NOT NULL DEFAULT 'You are Echo.',
        allowed_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
        public_api_key UUID NOT NULL DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE agents
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS greeting_message TEXT NOT NULL DEFAULT 'Hi, I''m Echo. How can I help?',
      ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#11b5a4',
      ADD COLUMN IF NOT EXISTS launcher_position TEXT NOT NULL DEFAULT 'right',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS allowed_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        domain TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS allowed_domains_agent_domain_unique_idx
      ON allowed_domains (agent_id, domain);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id TEXT NOT NULL DEFAULT 'default-company',
        agent_id TEXT NOT NULL DEFAULT 'default-agent',
        conversation_id TEXT,
        source TEXT NOT NULL DEFAULT 'PLAYGROUND',
        session_id TEXT NOT NULL,
        user_query TEXT NOT NULL,
        agent_response TEXT NOT NULL,
        retrieval_strategy TEXT,
        confidence_score FLOAT,
        fallback_used BOOLEAN DEFAULT FALSE,
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
        size_bytes INTEGER NOT NULL DEFAULT 0,
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
      ADD COLUMN IF NOT EXISTS size_bytes INTEGER NOT NULL DEFAULT 0,
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
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id TEXT NOT NULL DEFAULT 'default-company',
        agent_id TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'PLAYGROUND',
        session_id TEXT NOT NULL,
        customer_id TEXT,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        retrieval_strategy TEXT,
        confidence_score FLOAT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE analytics_logs
      ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT 'default-company',
      ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'default-agent',
      ADD COLUMN IF NOT EXISTS conversation_id TEXT,
      ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'PLAYGROUND',
      ADD COLUMN IF NOT EXISTS retrieval_strategy TEXT,
      ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
      ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT FALSE;
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

    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_scope_idx
      ON documents (company_id, agent_id, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS conversations_scope_idx
      ON conversations (company_id, agent_id, last_message_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS messages_conversation_idx
      ON messages (conversation_id, created_at ASC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS analytics_logs_scope_idx
      ON analytics_logs (company_id, agent_id, created_at DESC);
    `);
  } finally {
    client.release();
  }
}
