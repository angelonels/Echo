import express from 'express';
import { z } from 'zod';
import { agentWorkflow, chatModel } from '../agent';

const router = express.Router();

const ChatRequestSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  threadId: z.string().min(1, 'Thread ID is required for memory persistence'),
});

router.post('/', async (req, res) => {
  try {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    const { query, threadId } = parsed.data;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 1. Execute LangGraph Orchestrator
    const stream = await agentWorkflow.stream(
      { 
        originalQuery: query,
        messages: [{ role: 'user', content: query } as any] 
      },
      { configurable: { thread_id: threadId } }
    );
    
    let finalState: any = null;
    let fallbackTriggered = false;
    let loopCount = 0;

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ debug_chunk_key: Object.keys(chunk) })}\n\n`);
      if (chunk.expand) {
        loopCount++;
        res.write(`data: ${JSON.stringify({ status: 'expanding', queries: chunk.expand.searchQueries })}\n\n`);
      }
      if (chunk.retrieve) {
        const docs = chunk.retrieve.retrievedDocs.map((d: any) => ({ 
          content: d.content.substring(0, 50) + '...', 
          score: Number(d.rrf_score).toFixed(3) 
        }));
        res.write(`data: ${JSON.stringify({ status: 'retrieved', docs })}\n\n`);
      }
      if (chunk.grade) {
        res.write(`data: ${JSON.stringify({ status: 'grading', passed: chunk.grade.contextGraded })}\n\n`);
        finalState = Object.values(chunk)[0];
        if (!chunk.grade.contextGraded && loopCount >= 2) {
          fallbackTriggered = true;
          break; // Force break out of infinite LangGraph generator
        }
      }
      finalState = Object.values(chunk)[0];
    }

    // 2. State Machine Finished, Generate Grounded Response directly to stream
    let prompt = '';
    const docs = finalState?.retrievedDocs || [];
    const ctx = docs.map((d: any) => d.content).join('\\n---\\n');
    
    if (fallbackTriggered || finalState?.contextGraded === false) {
      prompt = `The user asked: ${query}. Our retrieval database does not contain this information. 
      State explicitly that you cannot find this in the documentation and DO NOT hallucinate an answer.`;
    } else {
      prompt = `You are Echo. Answer using ONLY the provided context. If the context is empty, apologize and admit you do not know.
      Context:
      ${ctx}
      Question:
      ${query}`;
    }

    res.write(`data: ${JSON.stringify({ status: 'generating' })}\n\n`);

    const resultStream = await chatModel.stream(prompt);
    for await (const c of resultStream) {
      const text = c.content as string;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Chat Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error during chat processing' });
    } else {
      res.end();
    }
  }
});

export default router;
