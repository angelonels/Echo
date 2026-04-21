import bcrypt from "bcrypt"
import { AppError } from "../../lib/errors.js"
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AuthTokenPayload,
} from "../../lib/jwt.js"
import { slugify } from "../../lib/slug.js"
import { AuthRepository } from "./auth.repository.js"

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async signup(input: {
    companyName: string
    fullName: string
    email: string
    password: string
  }) {
    const existingUser = await this.authRepository.findUserByEmail(input.email)
    if (existingUser) {
      throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists.")
    }

    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await this.authRepository.createOrganizationWithOwner({
      companyName: input.companyName.trim(),
      companySlug: slugify(input.companyName),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      fullName: input.fullName.trim(),
    })

    return this.buildAuthResponse(user)
  }

  async login(input: { email: string; password: string }) {
    const user = await this.authRepository.findUserByEmail(input.email)
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.")
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.")
    }

    return this.buildAuthResponse(user)
  }

  async refresh(refreshToken: string) {
    let payload: AuthTokenPayload

    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.")
    }

    const user = await this.authRepository.findUserById(payload.sub)
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User does not exist anymore.")
    }

    return this.buildAuthResponse(user)
  }

  async getCurrentUser(userId: string) {
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User does not exist anymore.")
    }

    return {
      user: {
        id: user.id,
        companyId: user.orgId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      company: {
        id: user.orgId,
        name: user.companyName,
        slug: user.companySlug,
      },
    }
  }

  private buildAuthResponse(user: {
    id: string
    orgId: string
    email: string
    fullName: string
    role: "OWNER" | "ADMIN"
    companyName: string
    companySlug: string
  }) {
    const tokenPayload = {
      sub: user.id,
      companyId: user.orgId,
      email: user.email,
      role: user.role,
    } as const

    return {
      user: {
        id: user.id,
        companyId: user.orgId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      company: {
        id: user.orgId,
        name: user.companyName,
        slug: user.companySlug,
      },
      tokens: {
        accessToken: signAccessToken(tokenPayload),
        refreshToken: signRefreshToken(tokenPayload),
      },
    }
  }
}
