export enum AnalyticsPipelineStep {
  Map = "map",
  Reduce = "reduce",
  Full = "full",
}

export enum StreamStatus {
  Initializing = "initializing",
  Expanding = "expanding",
  Retrieved = "retrieved",
  Grading = "grading",
  Generating = "generating",
  Done = "done",
}
