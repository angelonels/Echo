import { AppError } from "../../lib/errors.js";
import { AllowedDomainsRepository } from "./allowed-domains.repository.js";

export class AllowedDomainsService {
  constructor(private readonly allowedDomainsRepository: AllowedDomainsRepository) {}

  async listAllowedDomains(userId: string, agentId: string) {
    await this.assertAgentScope(userId, agentId);
    return {
      items: await this.allowedDomainsRepository.listAllowedDomainsForUser(userId, agentId),
    };
  }

  async addAllowedDomain(userId: string, agentId: string, domain: string) {
    await this.assertAgentScope(userId, agentId);
    return {
      domain: await this.allowedDomainsRepository.addAllowedDomainForUser(userId, agentId, normalizeDomain(domain)),
    };
  }

  async deleteAllowedDomain(userId: string, agentId: string, domainId: string) {
    await this.assertAgentScope(userId, agentId);
    const deleted = await this.allowedDomainsRepository.deleteAllowedDomainForUser(userId, agentId, domainId);
    if (!deleted) {
      throw new AppError(404, "DOMAIN_NOT_FOUND", "Allowed domain not found.");
    }

    return { success: true };
  }

  private async assertAgentScope(userId: string, agentId: string) {
    const exists = await this.allowedDomainsRepository.assertAgentForUser(userId, agentId);
    if (!exists) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }
  }
}

export function normalizeDomain(value: string) {
  const trimmed = value.trim().toLowerCase();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.host.replace(/\/$/, "");
  } catch {
    throw new AppError(400, "INVALID_DOMAIN", "Allowed domain must be a valid hostname.");
  }
}
