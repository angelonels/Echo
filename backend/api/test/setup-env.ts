import path from "node:path";
import { config } from "dotenv";

config({
  path: path.resolve(import.meta.dirname, "../../../.env"),
  override: false,
});

function rewriteHost(urlValue: string | undefined, expectedHost: string) {
  if (!urlValue) {
    return urlValue;
  }

  const parsed = new URL(urlValue);
  if (parsed.hostname !== expectedHost) {
    return urlValue;
  }

  parsed.hostname = "127.0.0.1";
  return parsed.toString();
}

process.env.REDIS_URL = rewriteHost(process.env.REDIS_URL, "redis");
process.env.DATABASE_URL = rewriteHost(process.env.DATABASE_URL, "postgres");
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST === "postgres" ? "127.0.0.1" : process.env.POSTGRES_HOST;
process.env.UPLOAD_ROOT =
  process.env.UPLOAD_ROOT === "/app/uploads"
    ? path.resolve(import.meta.dirname, "../../../uploads/test-runtime")
    : process.env.UPLOAD_ROOT;
