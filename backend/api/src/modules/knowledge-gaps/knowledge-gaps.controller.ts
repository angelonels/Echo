import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../lib/auth.js";
import { sendErrorResponse } from "../../lib/http.js";
import { KnowledgeGapsService } from "./knowledge-gaps.service.js";

export class KnowledgeGapsController {
  constructor(private readonly knowledgeGapsService: KnowledgeGapsService) {}

  listKnowledgeGaps = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response
        .status(200)
        .json(await this.knowledgeGapsService.listKnowledgeGaps(auth.userId, String(request.params.agentId)));
    } catch (error) {
      sendErrorResponse(response, error);
    }
  };
}
