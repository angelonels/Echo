import type { Response } from "express";

export function sendValidationError(response: Response, details: unknown) {
  return response.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details,
    },
  });
}
