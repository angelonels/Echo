import type { Request, Response } from "express"
import { ZodError, z } from "zod"
import { isAppError } from "../../lib/errors.js"
import { AgentsService } from "./agents.service.js"

const createAgentSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(8),
  greetingMessage: z.string().min(8),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/),
  launcherPosition: z.enum(["left", "right"]),
})

const updateAgentSchema = createAgentSchema.partial().extend({
  isActive: z.boolean().optional(),
})

const domainSchema = z.object({
  domain: z.string().min(3),
})

export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  listAgents = async (_request: Request, response: Response) => {
    try {
      response.status(200).json(await this.agentsService.listAgents())
    } catch (error) {
      this.handleError(response, error)
    }
  }

  getAgent = async (request: Request, response: Response) => {
    try {
      response.status(200).json(await this.agentsService.getAgent(String(request.params.agentId)))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  createAgent = async (request: Request, response: Response) => {
    try {
      const input = createAgentSchema.parse(request.body)
      response.status(201).json(await this.agentsService.createAgent(input))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  updateAgent = async (request: Request, response: Response) => {
    try {
      const input = updateAgentSchema.parse(request.body)
      response.status(200).json(await this.agentsService.updateAgent(String(request.params.agentId), input))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  addAllowedDomain = async (request: Request, response: Response) => {
    try {
      const input = domainSchema.parse(request.body)
      response.status(201).json(await this.agentsService.addAllowedDomain(String(request.params.agentId), input.domain))
    } catch (error) {
      this.handleError(response, error)
    }
  }

  deleteAllowedDomain = async (request: Request, response: Response) => {
    try {
      response.status(200).json(
        await this.agentsService.deleteAllowedDomain(String(request.params.agentId), String(request.params.domainId)),
      )
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
