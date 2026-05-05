export type UploadDocumentResponse = {
  message: string;
  documentId?: string;
  filename?: string;
  storedPath?: string;
  status?: "uploaded" | "extracting" | "chunking" | "embedding" | "indexing" | "ready" | "failed";
};
