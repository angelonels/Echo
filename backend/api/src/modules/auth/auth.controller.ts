import type { Request, Response } from "express"
import { getAuthenticatedUser } from "../../lib/auth.js"
import { sendErrorResponse } from "../../lib/http.js"

export class AuthController {
  me = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request)
      response.status(200).json({
        id: auth.userId,
        email: auth.email,
        name: auth.name,
        imageUrl: auth.imageUrl,
      })
    } catch (error) {
      this.handleError(response, error)
    }
  }

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error)
  }
}
