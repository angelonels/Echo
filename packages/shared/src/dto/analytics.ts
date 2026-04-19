import { AnalyticsPipelineStep } from "../constants/enums.js";

export type IssueCount = {
  name: string;
  count: number;
};

export type FrictionSummary = {
  top_issues: IssueCount[];
  avg_sentiment: number;
};

export type AnalyticsTriggerRequest = {
  step?: AnalyticsPipelineStep;
};

export type AnalyticsDailyResponse = {
  today: {
    reportDate?: string;
    topIssues?: IssueCount[];
    avgSentiment?: number | null;
  } | null;
  timeline: Array<{
    timeWindow: string | Date;
    frictionData: FrictionSummary;
  }>;
};
