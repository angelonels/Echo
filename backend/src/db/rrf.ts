import { db } from './index';
import { sql } from 'drizzle-orm';
import { knowledgeChunks } from './schema';

export async function retrieveRRF(query: string, embedding: number[]) {
  const embeddingString = `[${embedding.join(',')}]`;

  const rawQuery = sql`
    WITH vector_search AS (
      SELECT id, content,
             ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingString}::vector) AS rank
      FROM knowledge_chunks
      LIMIT 30
    ),
    keyword_search AS (
      SELECT id, content,
             ROW_NUMBER() OVER (ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC) AS rank
      FROM knowledge_chunks
      WHERE search_vector @@ plainto_tsquery('english', ${query})
      LIMIT 30
    ),
    fusion AS (
      SELECT COALESCE(v.id, k.id) AS id,
             COALESCE(v.content, k.content) AS content,
             (COALESCE(1.0 / (60 + v.rank), 0.0) + COALESCE(1.0 / (60 + k.rank), 0.0)) AS rrf_score
      FROM vector_search v
      FULL OUTER JOIN keyword_search k ON v.id = k.id
    )
    SELECT id, content, rrf_score
    FROM fusion
    ORDER BY rrf_score DESC
    LIMIT 30;
  `;

  const results = await db.execute(rawQuery);
  return results.rows as { id: string; content: string; rrf_score: number }[];
}
