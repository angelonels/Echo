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
