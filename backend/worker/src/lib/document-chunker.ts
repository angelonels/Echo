import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 900,
  chunkOverlap: 180,
  separators: ["\n## ", "\n### ", "\n\n", ". ", "\n", " "],
});

export class DocumentChunker {
  async chunk(text: string): Promise<Array<{
    content: string;
    chunkIndex: number;
    metadata: Record<string, unknown>;
  }>> {
    const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    const docs = await splitter.createDocuments([normalized]);

    return docs
      .map((doc, index) => ({
        content: doc.pageContent.trim(),
        chunkIndex: index,
        metadata: {
          sourceMetadata: doc.metadata,
        },
      }))
      .filter((chunk) => chunk.content.length > 0);
  }
}
