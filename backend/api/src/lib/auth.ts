import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "@clerk/backend";
import { env } from "../config/env.js";
import { CurrentUserService } from "../modules/users/current-user.service.js";
import { UsersRepository } from "../modules/users/users.repository.js";
import { AppError, isAppError } from "./errors.js";

export type AuthContext = {
  clerkUserId: string;
  userId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
};

const currentUserService = new CurrentUserService(new UsersRepository());

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Authorization token is required.");
    }

    const token = authorization.slice("Bearer ".length);
    request.auth = await authenticateToken(token);
    next();
  } catch (error) {
    const appError = isAppError(error)
      ? error
      : new AppError(401, "UNAUTHORIZED", "Authorization token is invalid or expired.");

    response.status(appError.statusCode).json({
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
    });
  }
}

export function getAuthenticatedUser(request: Request): AuthContext {
  if (!request.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authorization token is required.");
  }

  return request.auth;
}

async function authenticateToken(token: string): Promise<AuthContext> {
  if (env.CLERK_SECRET_KEY) {
    return authenticateClerkToken(token);
  }

  if (env.ENABLE_DEV_AUTH && env.NODE_ENV !== "production") {
    return authenticateDevToken(token);
  }

  throw new AppError(
    500,
    "AUTH_NOT_CONFIGURED",
    "Clerk authentication is not configured. Set CLERK_SECRET_KEY, or enable ENABLE_DEV_AUTH=true outside production.",
  );
}

async function authenticateClerkToken(token: string): Promise<AuthContext> {
  const payload = await verifyToken(token, {
    secretKey: env.CLERK_SECRET_KEY,
    jwtKey: env.CLERK_JWT_KEY,
    authorizedParties: parseCsv(env.CLERK_AUTHORIZED_PARTIES),
  });

  const clerkUserId = typeof payload.sub === "string" ? payload.sub : "";
  if (!clerkUserId) {
    throw new AppError(401, "UNAUTHORIZED", "Authorization token is missing a Clerk user id.");
  }

  const email = readStringClaim(payload, "email") ?? readStringClaim(payload, "primary_email_address") ?? null;
  const user = await currentUserService.sync({
    clerkUserId,
    email,
    name: readStringClaim(payload, "name"),
    imageUrl: readStringClaim(payload, "picture") ?? readStringClaim(payload, "image_url"),
  });

  return {
    clerkUserId,
    userId: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
  };
}

async function authenticateDevToken(token: string): Promise<AuthContext> {
  if (!token.startsWith("dev:")) {
    throw new AppError(401, "UNAUTHORIZED", "Development auth token must start with dev:.");
  }

  const tokenParts = token.slice("dev:".length).split(":");
  const clerkUserId = `dev:${tokenParts[0] || "local-user"}`;
  const email = tokenParts[1] || "developer@echo.local";
  const user = await currentUserService.sync({
    clerkUserId,
    email,
    name: email,
  });

  return {
    clerkUserId,
    userId: user.id,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
  };
}

function parseCsv(value: string | undefined): string[] | undefined {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items && items.length > 0 ? items : undefined;
}

function readStringClaim(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
