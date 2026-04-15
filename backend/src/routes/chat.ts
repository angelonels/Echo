import express from 'express';
import { z } from 'zod';
import { BedrockEmbeddings, ChatBedrockConverse } from '@langchain/aws';
import { PromptTemplate } from '@langchain/core/prompts';
import { db } from '../db/index';
import { knowledgeChunks } from '../db/schema';
import { cosineDistance, desc, sql } from 'drizzle-orm';

const router = express.Router();

const ChatRequestSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
});

const embeddings = new BedrockEmbeddings({
  region: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  model: 'amazon.titan-embed-text-v2:0', 
});

const chatModel = new ChatBedrockConverse({
  region: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // Replaced Claude with Open Source Llama 3 on Bedrock as requested
  model: 'meta.llama3-8b-instruct-v1:0', 
});

const RAG_TEMPLATE = `
You are Echo. Answer the user's question using ONLY the provided context. If the context does not contain the answer, say "I don't know". 

CONTEXT:
{context}

QUESTION:
{question}
`;

router.post('/', async (req, res) => {
  try {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    const { query } = parsed.data;

    // 1. Embed user query
    const queryVector = await embeddings.embedQuery(query);

    // 2. Retrieve Top 5 relevant chunks using Drizzle ORM pgvector native cosineDistance
    const searchRes = await db
      .select({ content: knowledgeChunks.content })
      .from(knowledgeChunks)
      .orderBy(cosineDistance(knowledgeChunks.embedding, queryVector))
      .limit(5);

    const contextText = searchRes.map(row => row.content).join('\n\n');

    // 3. Setup Langchain Chat
    const prompt = PromptTemplate.fromTemplate(RAG_TEMPLATE);
    const formattedPrompt = await prompt.format({
      context: contextText,
      question: query,
    });

    // 4. Stream response to Client using SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await chatModel.stream(formattedPrompt);

    for await (const chunk of stream) {
      if (chunk.content) {
        res.write(`data: ${JSON.stringify({ text: chunk.content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Chat Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error during chat processing' });
    }
  }
});

export default router;
