import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

export async function ensureUploadRoot() {
  await fs.mkdir(env.UPLOAD_ROOT, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    try {
      await ensureUploadRoot();
      callback(null, env.UPLOAD_ROOT);
    } catch (error) {
      callback(error as Error, env.UPLOAD_ROOT);
    }
  },
  filename: (_request, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

export const uploadMiddleware = multer({ storage });

export function resolveUploadPath(filename: string) {
  return path.join(env.UPLOAD_ROOT, filename);
}
