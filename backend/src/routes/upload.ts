import express from 'express';
import multer from 'multer';
import pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { BedrockEmbeddings } from '@langchain/aws';
import { db } from '../db/index';
import { documents, knowledgeChunks } from '../db/schema';
import { z } from 'zod';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const embeddings = new BedrockEmbeddings({
  region: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  model: 'amazon.titan-embed-text-v2:0', 
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;

    let textContent = '';
    if (mimetype === 'application/pdf') {
      // Cast to any to bypass strict Node16 CJS type constraint on this legacy package
      const pdfData = await (pdfParse as any)(buffer);
      textContent = pdfData.text;
    } else if (mimetype === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Only PDF or TXT files are allowed' });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([textContent]);
    const chunkTexts = chunks.map((c) => c.pageContent);

    // Get Embeddings
    const vectors = await embeddings.embedDocuments(chunkTexts);

    // Save to DB using Drizzle
    await db.transaction(async (tx) => {
      const [newDoc] = await tx
        .insert(documents)
        .values({ filename: originalname })
        .returning();

      if (!newDoc || !newDoc.id) {
        throw new Error('Database insertion for document failed');
      }

      const insertValues = chunkTexts.map((text, i) => ({
        docId: newDoc.id,
        content: text,
        embedding: vectors[i],
      }));

      await tx.insert(knowledgeChunks).values(insertValues);
    });

    res.status(201).json({ message: 'File uploaded and embedded successfully', chunksAdded: chunks.length });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal server error while processing the upload' });
  }
});

export default router;
