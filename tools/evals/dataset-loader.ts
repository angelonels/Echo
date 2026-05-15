import { readFile } from "node:fs/promises";
import { z } from "zod";

export const evalCaseSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  expectedBehavior: z.string().optional(),
  expectedAnswerContains: z.array(z.string()).optional(),
  referenceAnswer: z.string().optional(),
  shouldFallback: z.boolean().default(false),
  requiredSources: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export type EvalCase = z.infer<typeof evalCaseSchema>;

export async function loadJsonlDataset(path: string): Promise<EvalCase[]> {
  const content = await readFile(path, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return evalCaseSchema.parse(JSON.parse(line));
      } catch (error) {
        throw new Error(`Invalid eval case at ${path}:${index + 1}`, { cause: error });
      }
    });
}
