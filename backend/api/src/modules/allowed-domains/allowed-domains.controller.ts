import type { Request, Response } from "express";
import { z } from "zod";
import { getAuthenticatedUser } from "../../lib/auth.js";
import { sendErrorResponse } from "../../lib/http.js";
import { AllowedDomainsService } from "./allowed-domains.service.js";

const domainSchema = z.object({
  domain: z.string().trim().min(3).max(255),
});

export class AllowedDomainsController {
  constructor(private readonly allowedDomainsService: AllowedDomainsService) {}

  listAllowedDomains = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response
        .status(200)
        .json(await this.allowedDomainsService.listAllowedDomains(auth.userId, String(request.params.agentId)));
    } catch (error) {
      sendErrorResponse(response, error);
    }
  };

  addAllowedDomain = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      const input = domainSchema.parse(request.body);
      response
        .status(201)
        .json(await this.allowedDomainsService.addAllowedDomain(auth.userId, String(request.params.agentId), input.domain));
    } catch (error) {
      sendErrorResponse(response, error);
    }
  };

  deleteAllowedDomain = async (request: Request, response: Response) => {
    try {
      const auth = getAuthenticatedUser(request);
      response.status(200).json(
        await this.allowedDomainsService.deleteAllowedDomain(
          auth.userId,
          String(request.params.agentId),
          String(request.params.domainId),
        ),
      );
    } catch (error) {
      sendErrorResponse(response, error);
    }
  };
}
