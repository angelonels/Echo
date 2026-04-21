import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../config/env.js"

export type AuthTokenPayload = {
  sub: string
  companyId: string
  email: string
  role: "OWNER" | "ADMIN"
  type: "access" | "refresh"
}

function getJwtSecret() {
  return env.JWT_SECRET ?? "replace-me"
}

function getRefreshSecret() {
  return env.JWT_REFRESH_SECRET ?? getJwtSecret()
}

export function signAccessToken(payload: Omit<AuthTokenPayload, "type">) {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  return jwt.sign({ ...payload, type: "access" }, getJwtSecret(), {
    expiresIn,
  })
}

export function signRefreshToken(payload: Omit<AuthTokenPayload, "type">) {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  return jwt.sign({ ...payload, type: "refresh" }, getRefreshSecret(), {
    expiresIn,
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, getRefreshSecret()) as AuthTokenPayload
}
