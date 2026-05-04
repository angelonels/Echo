CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  email text,
  name text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  public_agent_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  visibility text NOT NULL DEFAULT 'private',
  base_instructions text,
  welcome_message text,
  fallback_message text,
  retrieval_mode text NOT NULL DEFAULT 'auto',
  temperature numeric NOT NULL DEFAULT 0.2,
  max_context_chunks integer NOT NULL DEFAULT 6,
  model_provider text NOT NULL DEFAULT 'bedrock',
  generation_model text NOT NULL,
  embedding_model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allowed_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, domain)
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL,
  current_version_id uuid,
  status text NOT NULL DEFAULT 'uploaded',
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_path text NOT NULL,
  content_hash text NOT NULL,
  extraction_status text NOT NULL DEFAULT 'pending',
  processing_error text,
  extracted_text text,
  extracted_text_hash text,
  chunk_count integer NOT NULL DEFAULT 0,
  embedding_model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(document_id, version_number)
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  doc_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  chunk_index text NOT NULL DEFAULT '0',
  content text NOT NULL,
  content_hash text,
  token_count integer,
  page_number integer,
  section_title text,
  embedding vector(1024),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  source text NOT NULL DEFAULT 'playground',
  session_id text NOT NULL,
  customer_id text,
  visitor_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  title text,
  last_message_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  retrieval_strategy text,
  confidence_score double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retrieval_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  channel text NOT NULL,
  user_question text NOT NULL,
  normalized_question text,
  detected_intent text,
  retrieval_strategy text NOT NULL,
  retrieved_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_version text,
  model_provider text,
  generation_model text,
  embedding_model text,
  response_type text NOT NULL,
  confidence numeric,
  confidence_components jsonb NOT NULL DEFAULT '{}'::jsonb,
  groundedness_score numeric,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  latency_ms integer,
  token_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_cost_usd numeric,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agents_user_status_idx ON agents (user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS documents_user_agent_idx ON documents (user_id, agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS document_versions_scope_idx ON document_versions (user_id, agent_id, document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_chunks_scope_idx ON knowledge_chunks (user_id, agent_id, doc_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx ON knowledge_chunks USING gin (search_vector);
CREATE INDEX IF NOT EXISTS conversations_scope_idx ON conversations (user_id, agent_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS retrieval_traces_scope_idx ON retrieval_traces (user_id, agent_id, created_at DESC);
