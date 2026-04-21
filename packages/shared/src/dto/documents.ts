export type UploadDocumentResponse = {
  message: string;
  documentId?: string;
  filename?: string;
  storedPath?: string;
  status?: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
};
