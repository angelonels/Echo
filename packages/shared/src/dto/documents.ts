export type UploadDocumentResponse = {
  message: string;
  documentId?: string;
  filename?: string;
  chunksAdded?: number;
  storedPath?: string;
};
