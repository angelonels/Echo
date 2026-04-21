import fs from "node:fs/promises";
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

    throw new Error(`Unsupported document type: ${mimeType}`);
  }
}
