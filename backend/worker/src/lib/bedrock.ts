import { ChatBedrockConverse } from "@langchain/aws";
import { env } from "../config/env.js";

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

export const chatModel = new ChatBedrockConverse({
  region: env.AWS_DEFAULT_REGION,
  credentials,
  model: "meta.llama3-8b-instruct-v1:0",
});

export async function invokeAnalyticsModel(prompt: string): Promise<string> {
  if (!credentials) {
    return JSON.stringify({
      top_issues: [
        { name: "Support knowledge gap", count: 1 },
        { name: "Troubleshooting request", count: 1 },
      ],
      avg_sentiment: 0,
    });
  }

  try {
    const response = await chatModel.invoke(prompt);
    return Array.isArray(response.content)
      ? response.content
          .map((item) => ("text" in item && typeof item.text === "string" ? item.text : ""))
          .join("")
      : String(response.content ?? "");
  } catch {
    return JSON.stringify({
      top_issues: [{ name: "Fallback analytics summary", count: 1 }],
      avg_sentiment: 0,
    });
  }
}
