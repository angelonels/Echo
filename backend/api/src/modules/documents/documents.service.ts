import fs from "node:fs/promises"
import { AppError } from "../../lib/errors.js"
import { documentsQueue } from "../../lib/queues.js"
import type { UploadMimeType } from "@echo/shared"
import { DocumentsRepository } from "./documents.repository.js"

export class DocumentsService {
  constructor(private readonly documentsRepository: DocumentsRepository) {}

  async listDocuments(agentId: string) {
    return {
      items: (await this.documentsRepository.listDocuments(agentId)).map((document) => this.toDocumentDto(document)),
    }
  }

  async getDocument(agentId: string, documentId: string) {
    const document = await this.documentsRepository.findDocument(agentId, documentId)
    if (!document) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.")
    }

    return {
      document: this.toDocumentDto(document),
    }
  }

  async uploadDocument(input: {
    agentId: string
    filename: string
    mimeType: UploadMimeType | string
    sizeBytes: number
    storagePath: string
  }) {
    const scope = await this.documentsRepository.findAgentScope(input.agentId)
    if (!scope) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    const document = await this.documentsRepository.createDocument({
      agentId: scope.agentId,
      companyId: scope.companyId,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
    })

    await documentsQueue.add(
      "ingest-document",
      {
        documentId: document.id,
        companyId: document.companyId,
        agentId: document.agentId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 20,
        removeOnFail: 20,
      },
    )

    return {
      document: this.toDocumentDto(document),
    }
  }

  async deleteDocument(agentId: string, documentId: string) {
    const document = await this.documentsRepository.findDocument(agentId, documentId)
    if (!document) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.")
    }

    await this.documentsRepository.deleteDocument(agentId, documentId)
    await fs.rm(document.storagePath, { force: true })

    return {
      success: true,
    }
  }

  async reindexDocument(agentId: string, documentId: string) {
    const document = await this.documentsRepository.findDocument(agentId, documentId)
    if (!document) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "Document not found.")
    }

    await documentsQueue.add(
      "ingest-document",
      {
        documentId: document.id,
        companyId: document.companyId,
        agentId: document.agentId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 20,
        removeOnFail: 20,
      },
    )

    return {
      success: true,
      status: "UPLOADED",
    }
  }

  private toDocumentDto(document: {
    id: string
    filename: string
    mimeType: string
    sizeBytes: number
    status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED"
    createdAt: string
    updatedAt: string
    processingError: string | null
  }) {
    return {
      id: document.id,
      fileName: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      status: document.status,
      createdAt: new Date(document.createdAt).toISOString(),
      updatedAt: new Date(document.updatedAt).toISOString(),
      versionGroupKey: null,
      errorMessage: document.processingError,
    }
  }
}
