import type { Request, Response } from "express"
import { ZodError } from "zod"
import { uploadDocumentSchema } from "@echo/shared"
import { isAppError } from "../../lib/errors.js"
import { resolveUploadPath } from "../../lib/uploads.js"
import { DocumentsService } from "./documents.service.js"

export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  listDocuments = async (request: Request, response: Response) => {
    try {
      response.status(200).json(await this.documentsService.listDocuments(String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getDocument = async (request: Request, response: Response) => {
    try {
      response.status(200).json(
        await this.documentsService.getDocument(
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
        agentId: request.params.agentId,
        companyId: "unused-route-scope",
      })

      response.status(202).json(
        await this.documentsService.uploadDocument({
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
      response.status(200).json(
        await this.documentsService.deleteDocument(
          String(request.params.agentId),
          String(request.params.documentId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  reindexDocument = async (request: Request, response: Response) => {
    try {
      response.status(202).json(
        await this.documentsService.reindexDocument(
          String(request.params.agentId),
          String(request.params.documentId),
        ),
      )
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten(),
        },
      })
      return
    }

    if (isAppError(error)) {
      response.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
      return
    }

    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
      },
    })
  }
}
