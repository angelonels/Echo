export const queueNames = {
  documents: "document-ingestion",
} as const;

export const envModes = ["development", "test", "production"] as const;

export enum UploadMimeType {
  Pdf = "application/pdf",
  Text = "text/plain",
  Markdown = "text/markdown",
  Docx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

export const uploadMimeTypes = [UploadMimeType.Pdf, UploadMimeType.Text, UploadMimeType.Markdown] as const;
