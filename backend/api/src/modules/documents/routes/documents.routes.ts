import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { uploadDocumentSchema } from "@echo/shared";
import { db } from "../../../lib/db.js";
import { documents } from "../../../lib/schema.js";
import { sendValidationError } from "../../../lib/http.js";
import { documentsQueue } from "../../../lib/queues.js";
import { resolveAgentScope } from "../../../lib/tenant-scope.js";
import { uploadMiddleware, resolveUploadPath } from "../../../lib/uploads.js";

const DEFAULT_COMPANY_ID = "default-company";
const DEFAULT_AGENT_ID = "default-agent";

const documentsRouter = Router();

documentsRouter.get("/", async (request, response) => {
  const companyId = String(request.query.companyId ?? DEFAULT_COMPANY_ID);
  const agentId = String(request.query.agentId ?? DEFAULT_AGENT_ID);

  try {
    const scope = await resolveAgentScope(companyId, agentId);
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.companyId, scope.companyScope))
      .orderBy(desc(documents.createdAt));

    response.status(200).json({
      items: rows
        .filter((row) => row.agentId === scope.agentId)
        .map((row) => ({
          id: row.id,
          fileName: row.filename,
          mimeType: row.mimeType,
          sizeBytes: 0,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          versionGroupKey: null,
          errorMessage: row.processingError,
        })),
    });
  } catch {
    response.status(500).json({ error: "Internal server error while fetching documents" });
  }
});

documentsRouter.post("/upload", uploadMiddleware.single("file"), async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ error: "No file uploaded" });
  }

  const companyId = String(request.body.companyId ?? DEFAULT_COMPANY_ID);
  const agentId = String(request.body.agentId ?? DEFAULT_AGENT_ID);

  const parsed = uploadDocumentSchema.safeParse({
    mimetype: request.file.mimetype,
    originalname: request.file.originalname,
    companyId,
    agentId,
  });

  if (!parsed.success) {
    return sendValidationError(response, parsed.error.format());
  }

  try {
    const storedPath = resolveUploadPath(request.file.filename);
    const scope = await resolveAgentScope(companyId, agentId);

    const [newDocument] = await db
      .insert(documents)
      .values({
        companyId: scope.companyScope,
        agentId: scope.agentId,
        filename: request.file.originalname,
        mimeType: request.file.mimetype,
        storagePath: storedPath,
        sizeBytes: request.file.size,
        status: "UPLOADED",
      })
      .returning();

    if (!newDocument) {
      throw new Error("Document insert failed");
    }

    await documentsQueue.add(
      "ingest-document",
      {
        documentId: newDocument.id,
        companyId: scope.companyScope,
        agentId: scope.agentId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 20,
        removeOnFail: 20,
      },
    );

    response.status(202).json({
      message: "File uploaded and queued for ingestion",
      documentId: newDocument.id,
      filename: request.file.originalname,
      storedPath,
      status: "UPLOADED",
    });
  } catch {
    response.status(500).json({ error: "Internal server error while queuing the upload" });
  }
});

export { documentsRouter };
