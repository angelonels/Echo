export const queueNames = {
  documents: "document-ingestion",
  analytics: "chat-analytics",
  maintenance: "maintenance-jobs",
} as const;

export const envModes = ["development", "test", "production"] as const;

export enum UploadMimeType {
  Pdf = "application/pdf",
  Text = "text/plain",
  Markdown = "text/markdown",
}

export const uploadMimeTypes = [UploadMimeType.Pdf, UploadMimeType.Text, UploadMimeType.Markdown] as const;
