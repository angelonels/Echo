import fs from "node:fs/promises";
import mammoth from "mammoth";
import * as pdfParseModule from "pdf-parse";

const pdfParse = (pdfParseModule as unknown as { default?: (buffer: Buffer) => Promise<{ text: string }> }).default ??
  (pdfParseModule as unknown as (buffer: Buffer) => Promise<{ text: string }>);

export class DocumentTextExtractor {
  async extract(storagePath: string, mimeType: string): Promise<string> {
    const buffer = await fs.readFile(storagePath);

    if (mimeType === "application/pdf") {
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      return buffer.toString("utf8");
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    throw new Error(`Unsupported document type: ${mimeType}`);
  }
}
