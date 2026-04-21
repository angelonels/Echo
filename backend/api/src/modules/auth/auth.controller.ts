import type { Request, Response } from "express"
import { ZodError, z } from "zod"
import { AppError, isAppError } from "../../lib/errors.js"
import { verifyAccessToken } from "../../lib/jwt.js"
import { AuthService } from "./auth.service.js"

const signupSchema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (request: Request, response: Response) => {
    try {
      const input = signupSchema.parse(request.body)
      const result = await this.authService.signup(input)
      response.status(201).json(result)
    } catch (error) {
      this.handleError(response, error)
    }
  }

  login = async (request: Request, response: Response) => {
    try {
      const input = loginSchema.parse(request.body)
      const result = await this.authService.login(input)
      response.status(200).json(result)
    } catch (error) {
      this.handleError(response, error)
    }
  }

  refresh = async (request: Request, response: Response) => {
    try {
      const input = refreshSchema.parse(request.body)
      const result = await this.authService.refresh(input.refreshToken)
      response.status(200).json(result)
    } catch (error) {
      this.handleError(response, error)
    }
  }

  me = async (request: Request, response: Response) => {
    try {
      const authorization = request.headers.authorization
      if (!authorization?.startsWith("Bearer ")) {
        throw new AppError(401, "UNAUTHORIZED", "Authorization token is required.")
      }

      const payload = verifyAccessToken(authorization.slice("Bearer ".length))
      const result = await this.authService.getCurrentUser(payload.sub)
      response.status(200).json(result)
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten(),
        },
      })
      return
    }

    if (isAppError(error)) {
      response.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      })
      return
    }

    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
      },
    })
  }
}
