import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'echodb',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

export const db = drizzle(pool, { schema });

export const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    
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

    await client.query(`CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx ON knowledge_chunks USING GIN (search_vector);`);

    console.log('Database initialized successfully with Drizzle underlying tables and Hybrid Search Indices.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};
