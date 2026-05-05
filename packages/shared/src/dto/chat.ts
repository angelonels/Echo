export type RetrievedDocumentPreview = {
  content: string;
  score: string;
};

import { StreamStatus } from "../constants/enums.js";

export type ChatStreamEvent =
  | { status: StreamStatus.Initializing }
  | { status: StreamStatus.Expanding; queries?: string[] }
  | { status: StreamStatus.Retrieved; docs?: RetrievedDocumentPreview[] }
  | { status: StreamStatus.Grading; passed: boolean }
  | { status: StreamStatus.Generating }
  | { status: StreamStatus.Done }
  | { text: string };
