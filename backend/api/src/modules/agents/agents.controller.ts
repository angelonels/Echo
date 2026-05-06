import type { Request, Response } from "express";
import { z } from "zod";
import { getAuthenticatedUser } from "../../lib/auth.js";
import { sendErrorResponse } from "../../lib/http.js";
import { AgentsService } from "./agents.service.js";

const agentStatusSchema = z.enum(["draft", "active", "paused", "archived"]);
const agentVisibilitySchema = z.enum(["private", "public"]);
const retrievalModeSchema = z.enum(["auto", "naive", "multi_query", "hybrid"]);

const createAgentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1_000).optional().nullable(),
  status: agentStatusSchema.optional(),
  visibility: agentVisibilitySchema.optional(),
  baseInstructions: z.string().trim().max(4_000).optional().nullable(),
  welcomeMessage: z.string().trim().max(500).optional().nullable(),
  greetingMessage: z.string().trim().max(500).optional(),
  fallbackMessage: z.string().trim().max(500).optional().nullable(),
  retrievalMode: retrievalModeSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxContextChunks: z.number().int().min(1).max(20).optional(),
  modelProvider: z.string().trim().min(1).max(80).optional(),
  generationModel: z.string().trim().min(1).max(160).optional(),
  embeddingModel: z.string().trim().min(1).max(160).optional(),
});

const updateAgentSchema = createAgentSchema.partial().extend({
  greetingMessage: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  listAgents = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response.status(200).json(await this.agentsService.listAgents(auth.userId));
    } catch (error) {
      this.handleError(response, error);
    }
  };

  getAgent = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response.status(200).json(await this.agentsService.getAgent(auth.userId, String(request.params.agentId)));
    } catch (error) {
      this.handleError(response, error);
    }
  };

  createAgent = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      const input = createAgentSchema.parse(request.body);
      response.status(201).json(
        await this.agentsService.createAgent(auth.userId, {
          ...input,
          welcomeMessage: input.welcomeMessage ?? input.greetingMessage,
        }),
      );
    } catch (error) {
      this.handleError(response, error);
    }
  };

  updateAgent = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      const input = updateAgentSchema.parse(request.body);
      response.status(200).json(
        await this.agentsService.updateAgent(auth.userId, String(request.params.agentId), {
          ...input,
          welcomeMessage: input.welcomeMessage ?? input.greetingMessage,
          status: input.status ?? (input.isActive === undefined ? undefined : input.isActive ? "active" : "paused"),
        }),
      );
    } catch (error) {
      this.handleError(response, error);
    }
  };

  deleteAgent = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response.status(200).json(await this.agentsService.deleteAgent(auth.userId, String(request.params.agentId)));
    } catch (error) {
      this.handleError(response, error);
    }
  };

  private handleError(response: Response, error: unknown) {
    sendErrorResponse(response, error);
  }
}
