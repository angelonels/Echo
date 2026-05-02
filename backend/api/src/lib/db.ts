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
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id TEXT NOT NULL UNIQUE,
        email TEXT,
        name TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_user_id_unique_idx
      ON users (clerk_user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        public_agent_key TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'draft',
        visibility TEXT NOT NULL DEFAULT 'private',
        base_instructions TEXT,
        welcome_message TEXT,
        fallback_message TEXT,
        retrieval_mode TEXT NOT NULL DEFAULT 'auto',
        temperature NUMERIC NOT NULL DEFAULT 0.2,
        max_context_chunks INTEGER NOT NULL DEFAULT 6,
        model_provider TEXT NOT NULL DEFAULT 'bedrock',
        generation_model TEXT NOT NULL DEFAULT 'amazon.nova-lite-v1:0',
        embedding_model TEXT NOT NULL DEFAULT 'amazon.titan-embed-text-v2:0',
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
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS public_agent_key TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private',
      ADD COLUMN IF NOT EXISTS base_instructions TEXT,
      ADD COLUMN IF NOT EXISTS welcome_message TEXT,
      ADD COLUMN IF NOT EXISTS fallback_message TEXT,
      ADD COLUMN IF NOT EXISTS retrieval_mode TEXT NOT NULL DEFAULT 'auto',
      ADD COLUMN IF NOT EXISTS temperature NUMERIC NOT NULL DEFAULT 0.2,
      ADD COLUMN IF NOT EXISTS max_context_chunks INTEGER NOT NULL DEFAULT 6,
      ADD COLUMN IF NOT EXISTS model_provider TEXT NOT NULL DEFAULT 'bedrock',
      ADD COLUMN IF NOT EXISTS generation_model TEXT NOT NULL DEFAULT 'amazon.nova-lite-v1:0',
      ADD COLUMN IF NOT EXISTS embedding_model TEXT NOT NULL DEFAULT 'amazon.titan-embed-text-v2:0',
      ADD COLUMN IF NOT EXISTS greeting_message TEXT NOT NULL DEFAULT 'Hi, I''m Echo. How can I help?',
      ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#11b5a4',
      ADD COLUMN IF NOT EXISTS launcher_position TEXT NOT NULL DEFAULT 'right',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      ALTER TABLE agents
      ALTER COLUMN description DROP NOT NULL;
    `);

    await client.query(`
      UPDATE agents
      SET
        public_agent_key = COALESCE(public_agent_key, 'agent_pub_' || replace(public_api_key::text, '-', '')),
        welcome_message = COALESCE(welcome_message, greeting_message),
        base_instructions = COALESCE(base_instructions, system_prompt),
        status = CASE
          WHEN status IS NOT NULL AND status <> '' THEN status
          WHEN is_active THEN 'active'
          ELSE 'paused'
        END
      WHERE public_agent_key IS NULL
         OR welcome_message IS NULL
         OR base_instructions IS NULL;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS agents_public_agent_key_unique_idx
      ON agents (public_agent_key);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS agents_user_status_idx
      ON agents (user_id, status, updated_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS allowed_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        domain TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS allowed_domains_agent_domain_unique_idx
      ON allowed_domains (agent_id, domain);
    `);

    await client.query(`
      ALTER TABLE allowed_domains
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id TEXT NOT NULL DEFAULT 'default-company',
        agent_id TEXT NOT NULL DEFAULT 'default-agent',
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'text/plain',
        storage_path TEXT NOT NULL DEFAULT '',
        size_bytes INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'uploaded',
        processing_error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS current_version_id UUID,
      ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT 'default-company',
      ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'default-agent',
      ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'text/plain',
      ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS size_bytes INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'uploaded',
      ADD COLUMN IF NOT EXISTS processing_error TEXT,
      ADD COLUMN IF NOT EXISTS original_filename TEXT,
      ADD COLUMN IF NOT EXISTS display_name TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      UPDATE documents
      SET
        original_filename = COALESCE(original_filename, filename),
        display_name = COALESCE(display_name, filename)
      WHERE original_filename IS NULL OR display_name IS NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        extraction_status TEXT NOT NULL DEFAULT 'pending',
        processing_error TEXT,
        extracted_text TEXT,
        extracted_text_hash TEXT,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        embedding_model TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        UNIQUE(document_id, version_number)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS document_versions_scope_idx
      ON document_versions (user_id, agent_id, document_id, created_at DESC);
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
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS document_version_id UUID REFERENCES document_versions(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS content_hash TEXT,
      ADD COLUMN IF NOT EXISTS token_count INTEGER,
      ADD COLUMN IF NOT EXISTS page_number INTEGER,
      ADD COLUMN IF NOT EXISTS section_title TEXT,
      ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT 'default-company',
      ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'default-agent',
      ADD COLUMN IF NOT EXISTS chunk_index TEXT NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company_id TEXT NOT NULL DEFAULT 'default-company',
        agent_id TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'playground',
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
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        retrieval_strategy TEXT,
        confidence_score FLOAT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS retrieval_traces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        channel TEXT NOT NULL,
        user_question TEXT NOT NULL,
        normalized_question TEXT,
        detected_intent TEXT,
        retrieval_strategy TEXT NOT NULL,
        retrieved_chunks JSONB NOT NULL DEFAULT '[]'::jsonb,
        selected_chunks JSONB NOT NULL DEFAULT '[]'::jsonb,
        prompt_version TEXT,
        model_provider TEXT,
        generation_model TEXT,
        embedding_model TEXT,
        response_type TEXT NOT NULL,
        confidence NUMERIC,
        confidence_components JSONB NOT NULL DEFAULT '{}'::jsonb,
        groundedness_score NUMERIC,
        citations JSONB NOT NULL DEFAULT '[]'::jsonb,
        latency_ms INTEGER,
        token_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
        estimated_cost_usd NUMERIC,
        warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
        error_code TEXT,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS retrieval_traces_scope_idx
      ON retrieval_traces (user_id, agent_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        rating TEXT NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS feedback_events_scope_idx
      ON feedback_events (user_id, agent_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_gap_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        trace_id UUID REFERENCES retrieval_traces(id) ON DELETE SET NULL,
        question TEXT NOT NULL,
        normalized_question TEXT,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS knowledge_gap_events_scope_idx
      ON knowledge_gap_events (user_id, agent_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_gaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        example_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        occurrence_count INTEGER NOT NULL DEFAULT 1,
        first_seen_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        suggested_faq_question TEXT,
        suggested_faq_answer TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS knowledge_gaps_scope_idx
      ON knowledge_gaps (user_id, agent_id, status, last_seen_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx
      ON knowledge_chunks
      USING GIN (search_vector);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS knowledge_chunks_scope_idx
      ON knowledge_chunks (user_id, agent_id, document_version_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS documents_scope_idx
      ON documents (user_id, agent_id, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS conversations_scope_idx
      ON conversations (user_id, agent_id, last_message_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS messages_conversation_idx
      ON messages (conversation_id, created_at ASC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS agents_user_scope_idx
      ON agents (user_id, updated_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS allowed_domains_user_agent_idx
      ON allowed_domains (user_id, agent_id);
    `);
  } finally {
    client.release();
  }
}
