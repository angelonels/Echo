import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { EvalCaseResult } from "./metric-computer.js";

export type EvalReport = {
  dataset: string;
  generatedAt: string;
  cases: number;
  passed: number;
  failed: number;
  results: EvalCaseResult[];
};

export async function writeEvalReports(report: EvalReport, outputDir = "tools/evals/reports") {
  await mkdir(outputDir, { recursive: true });
  const jsonPath = join(outputDir, "latest-summary.json");
  const markdownPath = join(outputDir, "latest-report.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdownReport(report));

  return { jsonPath, markdownPath };
}

function renderMarkdownReport(report: EvalReport) {
  const failedCases = report.results.filter((result) => !result.passed);
  const lines = [
    "# Echo Eval Report",
    "",
    `Dataset: ${report.dataset}`,
    `Generated: ${report.generatedAt}`,
    `Cases: ${report.cases}`,
    `Passed: ${report.passed}`,
    `Failed: ${report.failed}`,
    "",
    "## Failed Cases",
    "",
    ...failedCases.map((result) => `- ${result.caseId}: ${result.failureReason ?? "unknown_failure"}`),
    "",
  ];

  return lines.join("\n");
}
