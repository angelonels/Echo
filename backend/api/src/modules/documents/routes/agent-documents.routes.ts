import { Router } from "express"
import { uploadMiddleware } from "../../../lib/uploads.js"
import { DocumentsController } from "../documents.controller.js"
import { DocumentsRepository } from "../documents.repository.js"
import { DocumentsService } from "../documents.service.js"

const documentsRepository = new DocumentsRepository()
const documentsService = new DocumentsService(documentsRepository)
const documentsController = new DocumentsController(documentsService)

export const agentDocumentsRouter = Router({ mergeParams: true })

agentDocumentsRouter.get("/", documentsController.listDocuments)
agentDocumentsRouter.post("/", uploadMiddleware.single("file"), documentsController.uploadDocument)
agentDocumentsRouter.get("/:documentId", documentsController.getDocument)
agentDocumentsRouter.delete("/:documentId", documentsController.deleteDocument)
agentDocumentsRouter.post("/:documentId/reindex", documentsController.reindexDocument)
