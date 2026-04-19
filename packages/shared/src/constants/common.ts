export const queueNames = {
  analytics: "chat-analytics",
  maintenance: "maintenance-jobs",
} as const;

export const envModes = ["development", "test", "production"] as const;

export enum UploadMimeType {
  Pdf = "application/pdf",
  Text = "text/plain",
}

export const uploadMimeTypes = [UploadMimeType.Pdf, UploadMimeType.Text] as const;
