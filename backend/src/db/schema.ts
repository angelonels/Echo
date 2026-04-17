import { pgTable, uuid, text, timestamp, vector, customType } from 'drizzle-orm/pg-core';

const tsvectorType = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  docId: uuid('doc_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  searchVector: tsvectorType('search_vector'),
  embedding: vector('embedding', { dimensions: 1024 }),
});
