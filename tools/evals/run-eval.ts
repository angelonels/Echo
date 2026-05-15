import { loadJsonlDataset } from "./dataset-loader.js";
import { defaultEvalThresholds } from "./eval-config.js";
import { scorePlaceholderCase } from "./metric-computer.js";
import { writeEvalReports } from "./report-writer.js";

function readDatasetArg() {
  const datasetIndex = process.argv.indexOf("--dataset");
  if (datasetIndex >= 0) {
    return process.argv[datasetIndex + 1];
  }

  return "tools/evals/datasets/support-smoke.jsonl";
}

async function main() {
  const dataset = readDatasetArg();
  const cases = await loadJsonlDataset(dataset);
  const results = cases.map((testCase) => scorePlaceholderCase(testCase, defaultEvalThresholds));
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  const report = {
    dataset,
    generatedAt: new Date().toISOString(),
    cases: results.length,
    passed,
    failed,
    results,
  };

  const paths = await writeEvalReports(report);

  console.log("Echo Eval Report");
  console.log(`Dataset: ${dataset}`);
  console.log(`Cases: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`JSON: ${paths.jsonPath}`);
  console.log(`Markdown: ${paths.markdownPath}`);

  if (failed > 0 && process.env.EVAL_FAIL_ON_THRESHOLD === "true") {
    process.exitCode = 1;
  }
}

void main();
