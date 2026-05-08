import type { Request, Response } from "express"
import { ZodError } from "zod"
import { uploadDocumentSchema } from "@echo/shared"
import { getAuthenticatedUser } from "../../lib/auth.js"
import { sendErrorResponse } from "../../lib/http.js"
import { resolveUploadPath } from "../../lib/uploads.js"
import { DocumentsService } from "./documents.service.js"

export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  listDocuments = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json(await this.documentsService.listDocuments(auth.userId, String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getDocument = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json(
        await this.documentsService.getDocument(
          auth.userId,
          String(request.params.agentId),
          String(request.params.documentId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  uploadDocument = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      if (!request.file) {
        throw new ZodError([
          {
            code: "custom",
            path: ["file"],
            message: "File is required.",
          },
        ])
      }

      uploadDocumentSchema.parse({
        mimetype: request.file.mimetype,
        originalname: request.file.originalname,
        size: request.file.size,
        agentId: request.params.agentId,
      })

      response.status(202).json(
        await this.documentsService.uploadDocument({
          userId: auth.userId,
          agentId: String(request.params.agentId),
          filename: request.file.originalname,
          mimeType: request.file.mimetype,
          sizeBytes: request.file.size,
          storagePath: resolveUploadPath(request.file.filename),
        }),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  deleteDocument = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json(
        await this.documentsService.deleteDocument(
          auth.userId,
          String(request.params.agentId),
          String(request.params.documentId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  replaceDocument = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      if (!request.file) {
        throw new ZodError([
          {
            code: "custom",
            path: ["file"],
            message: "File is required.",
          },
        ])
      }

      uploadDocumentSchema.parse({
        mimetype: request.file.mimetype,
        originalname: request.file.originalname,
        size: request.file.size,
        agentId: request.params.agentId,
      })

      response.status(202).json(
        await this.documentsService.replaceDocument({
          userId: auth.userId,
          agentId: String(request.params.agentId),
          documentId: String(request.params.documentId),
          filename: request.file.originalname,
          mimeType: request.file.mimetype,
          sizeBytes: request.file.size,
          storagePath: resolveUploadPath(request.file.filename),
        }),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  reindexDocument = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(202).json(
        await this.documentsService.reindexDocument(
          auth.userId,
          String(request.params.agentId),
          String(request.params.documentId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error)
  }
}
