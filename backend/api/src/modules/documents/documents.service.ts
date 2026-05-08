import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { enqueueDocumentIngestion } from "../../lib/queues.js";
import type { UploadMimeType } from "@echo/shared";
import { DocumentsRepository, type DocumentRecord } from "./documents.repository.js";

const allowedExtensions = new Set([".pdf", ".md", ".markdown", ".txt", ".docx"]);

export class DocumentsService {
  constructor(private readonly documentsRepository: DocumentsRepository) {}

  async listDocuments(userId: string, agentId: string) {
    await this.assertAgentScope(userId, agentId);

    return {
      items: (await this.documentsRepository.listDocuments(userId, agentId)).map((document) => this.toDocumentDto(document)),
    };
  }

  async getDocument(userId: string, agentId: string, documentId: string) {
    await this.assertAgentScope(userId, agentId);

    const document = await this.documentsRepository.findDocument(userId, agentId, documentId);
    if (!document) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    }

    return {
      document: this.toDocumentDto(document),
    };
  }

  async uploadDocument(input: {
    userId: string;
    agentId: string;
    filename: string;
    mimeType: UploadMimeType | string;
    sizeBytes: number;
    storagePath: string;
  }) {
    await this.assertAgentScope(input.userId, input.agentId);
    this.validateFilename(input.filename);

    const documentCount = await this.documentsRepository.countDocumentsForAgent(input.userId, input.agentId);
    if (documentCount >= env.MAX_DOCUMENTS_PER_AGENT) {
      await fs.rm(input.storagePath, { force: true });
      throw new AppError(409, "DOCUMENT_LIMIT_REACHED", `Agents can have up to ${env.MAX_DOCUMENTS_PER_AGENT} documents.`);
    }

    const content = await fs.readFile(input.storagePath);
    if (content.length === 0) {
      await fs.rm(input.storagePath, { force: true });
      throw new AppError(400, "EMPTY_DOCUMENT", "Uploaded document is empty.");
    }

    const contentHash = createHash("sha256").update(content).digest("hex");
    const duplicate = await this.documentsRepository.findDuplicateContentHash(input.userId, input.agentId, contentHash);
    if (duplicate) {
      await fs.rm(input.storagePath, { force: true });
      return {
        document: this.toDocumentDto(duplicate),
        duplicate: true,
      };
    }

    const document = await this.documentsRepository.createDocumentWithVersion({
      userId: input.userId,
      agentId: input.agentId,
      originalFilename: input.filename,
      displayName: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
      contentHash,
      embeddingModel: env.DEFAULT_EMBEDDING_MODEL,
    });

    await enqueueDocumentIngestion({
      userId: document.userId,
      documentId: document.id,
      agentId: document.agentId,
      documentVersionId: document.currentVersionId ?? document.id,
    });

    return {
      document: this.toDocumentDto(document),
      duplicate: false,
    };
  }

  async deleteDocument(userId: string, agentId: string, documentId: string) {
    await this.assertAgentScope(userId, agentId);

    const document = await this.documentsRepository.findDocument(userId, agentId, documentId);
    if (!document) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    }

    const deleted = await this.documentsRepository.deleteDocument(userId, agentId, documentId);
    if (deleted) {
      await fs.rm(document.storagePath, { force: true });
    }

    return {
      success: true,
    };
  }

  async replaceDocument(input: {
    userId: string;
    agentId: string;
    documentId: string;
    filename: string;
    mimeType: UploadMimeType | string;
    sizeBytes: number;
    storagePath: string;
  }) {
    await this.assertAgentScope(input.userId, input.agentId);
    this.validateFilename(input.filename);

    const existing = await this.documentsRepository.findDocument(input.userId, input.agentId, input.documentId);
    if (!existing) {
      await fs.rm(input.storagePath, { force: true });
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    }

    const content = await fs.readFile(input.storagePath);
    if (content.length === 0) {
      await fs.rm(input.storagePath, { force: true });
      throw new AppError(400, "EMPTY_DOCUMENT", "Uploaded document is empty.");
    }

    const contentHash = createHash("sha256").update(content).digest("hex");
    const document = await this.documentsRepository.createNextVersion({
      documentId: input.documentId,
      userId: input.userId,
      agentId: input.agentId,
      originalFilename: input.filename,
      displayName: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
      contentHash,
      embeddingModel: env.DEFAULT_EMBEDDING_MODEL,
    });

    if (!document?.currentVersionId) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    }

    const versionId = await this.documentsRepository.findLatestPendingVersionId(input.userId, input.agentId, input.documentId);
    if (!versionId) {
      throw new AppError(500, "DOCUMENT_VERSION_NOT_FOUND", "Replacement document version could not be loaded.");
    }

    await enqueueDocumentIngestion({
      userId: input.userId,
      agentId: input.agentId,
      documentId: input.documentId,
      documentVersionId: versionId,
    });

    return {
      document: this.toDocumentDto(document),
    };
  }

  async reindexDocument(userId: string, agentId: string, documentId: string) {
    await this.assertAgentScope(userId, agentId);

    const existing = await this.documentsRepository.findDocument(userId, agentId, documentId);
    if (!existing) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    }

    const content = await fs.readFile(existing.storagePath);
    const contentHash = createHash("sha256").update(content).digest("hex");
    const document = await this.documentsRepository.createNextVersion({
      documentId,
      userId,
      agentId,
      originalFilename: existing.originalFilename,
      displayName: existing.displayName,
      mimeType: existing.mimeType,
      sizeBytes: existing.sizeBytes,
      storagePath: existing.storagePath,
      contentHash,
      embeddingModel: env.DEFAULT_EMBEDDING_MODEL,
    });

    if (!document?.currentVersionId) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    }

    const versionId = await this.documentsRepository.findLatestPendingVersionId(userId, agentId, documentId);
    if (!versionId) {
      throw new AppError(500, "DOCUMENT_VERSION_NOT_FOUND", "Reindex document version could not be loaded.");
    }

    await enqueueDocumentIngestion({
      userId,
      agentId,
      documentId,
      documentVersionId: versionId,
    });

    return {
      document: this.toDocumentDto(document),
    };
  }

  private toDocumentDto(document: DocumentRecord) {
    return {
      id: document.id,
      agentId: document.agentId,
      originalFilename: document.originalFilename,
      displayName: document.displayName,
      fileName: document.displayName,
      mimeType: document.mimeType,
      sizeBytes: Number(document.sizeBytes),
      status: document.status,
      currentVersionId: document.currentVersionId,
      versionNumber: document.versionNumber,
      chunkCount: document.chunkCount,
      processingError: document.processingError,
      errorMessage: document.processingError,
      createdAt: new Date(document.createdAt).toISOString(),
      updatedAt: new Date(document.updatedAt).toISOString(),
    };
  }

  private async assertAgentScope(userId: string, agentId: string) {
    const exists = await this.documentsRepository.assertAgentForUser(userId, agentId);
    if (!exists) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }
  }

  private validateFilename(filename: string) {
    const extension = path.extname(filename).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      throw new AppError(400, "UNSUPPORTED_FILE_TYPE", "Supported file types are PDF, Markdown, TXT, and DOCX.");
    }

    if (/[\\/]/.test(filename) || filename.includes("..")) {
      throw new AppError(400, "INVALID_FILENAME", "Filename is not safe to store.");
    }
  }
}
