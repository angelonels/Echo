import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "./errors.js";

export function sendValidationError(response: Response, details: unknown) {
  return response.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details,
    },
  });
}

export function sendErrorResponse(response: Response, error: unknown) {
  if (error instanceof ZodError) {
    return sendValidationError(response, error.flatten());
  }

  if (isAppError(error)) {
    return response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  return response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  });
}

export function asyncRoute(handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function errorMiddleware(error: unknown, _request: Request, response: Response, next: NextFunction) {
  if (response.headersSent) {
    next(error);
    return;
  }

  sendErrorResponse(response, error);
}
