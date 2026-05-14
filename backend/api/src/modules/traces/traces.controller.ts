import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../lib/auth.js";
import { sendErrorResponse } from "../../lib/http.js";
import { TracesService } from "./traces.service.js";

export class TracesController {
  constructor(private readonly tracesService: TracesService) {}

  listTraces = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response.status(200).json(await this.tracesService.listTraces(auth.userId, String(request.params.agentId)));
    } catch (error) {
      sendErrorResponse(response, error);
    }
  };

  getTrace = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response
        .status(200)
        .json(await this.tracesService.getTrace(auth.userId, String(request.params.agentId), String(request.params.traceId)));
    } catch (error) {
      sendErrorResponse(response, error);
    }
  };
}
