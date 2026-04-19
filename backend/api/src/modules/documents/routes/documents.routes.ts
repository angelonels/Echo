import fs from "node:fs/promises";
import { Router } from "express";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { BedrockEmbeddings } from "@langchain/aws";
import { PDFParse } from "pdf-parse";
import { UploadMimeType, uploadDocumentSchema } from "@echo/shared";
import { db } from "../../../lib/db.js";
import { documents, knowledgeChunks } from "../../../lib/schema.js";
import { env } from "../../../config/env.js";
import { sendValidationError } from "../../../lib/http.js";
import { uploadMiddleware, resolveUploadPath } from "../../../lib/uploads.js";

const documentsRouter = Router();

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

const embeddings = new BedrockEmbeddings({
  region: env.AWS_DEFAULT_REGION,
  credentials,
  model: "amazon.titan-embed-text-v2:0",
});

documentsRouter.post("/upload", uploadMiddleware.single("file"), async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ error: "No file uploaded" });
  }

  const parsed = uploadDocumentSchema.safeParse({
    mimetype: request.file.mimetype,
    originalname: request.file.originalname,
  });

  if (!parsed.success) {
    return sendValidationError(response, parsed.error.format());
  }

  try {
    const storedPath = resolveUploadPath(request.file.filename);
    const fileBuffer = await fs.readFile(storedPath);

    let textContent = "";
    if (request.file.mimetype === UploadMimeType.Pdf) {
      const parser = new PDFParse({ data: fileBuffer });
      const pdfData = await parser.getText();
      textContent = pdfData.text;
      await parser.destroy();
    } else if (request.file.mimetype === UploadMimeType.Text) {
      textContent = fileBuffer.toString("utf-8");
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([textContent]);
    const chunkTexts = chunks.map((chunk) => chunk.pageContent);
    const vectors = await embeddings.embedDocuments(chunkTexts);

    let newDocumentId = "";

    await db.transaction(async (transaction) => {
      const [newDocument] = await transaction
        .insert(documents)
        .values({
          filename: request.file!.originalname,
          storagePath: storedPath,
        })
        .returning();

      if (!newDocument?.id) {
        throw new Error("Document insert failed");
      }

      newDocumentId = newDocument.id;

      await transaction.insert(knowledgeChunks).values(
        chunkTexts.map((text, index) => ({
          docId: newDocument.id,
          content: text,
          embedding: vectors[index],
        })),
      );
    });

    response.status(201).json({
      message: "File uploaded and embedded successfully",
      documentId: newDocumentId,
      filename: request.file.originalname,
      chunksAdded: chunks.length,
      storedPath,
    });
  } catch (error) {
    response.status(500).json({ error: "Internal server error while processing the upload" });
  }
});

export { documentsRouter };
