import { AppError } from "../../lib/errors.js"
import { AgentsRepository } from "./agents.repository.js"

export class AgentsService {
  constructor(private readonly agentsRepository: AgentsRepository) {}

  async listAgents() {
    const agents = await this.agentsRepository.listAgents()
    return {
      items: await Promise.all(agents.map((agent) => this.toAgentSummary(agent))),
    }
  }

  async getAgent(agentId: string) {
    const agent = await this.agentsRepository.findAgentById(agentId)
    if (!agent) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    return this.toAgentDetail(agent)
  }

  async createAgent(input: {
    name: string
    description: string
    greetingMessage: string
    primaryColor: string
    launcherPosition: "left" | "right"
  }) {
    const organization = await this.agentsRepository.ensureDefaultOrganization()
    const agent = await this.agentsRepository.createAgent({
      orgId: organization.id,
      ...input,
    })

    return this.toAgentDetail(agent)
  }

  async updateAgent(
    agentId: string,
    input: Partial<{
      name: string
      description: string
      greetingMessage: string
      primaryColor: string
      launcherPosition: "left" | "right"
      isActive: boolean
    }>,
  ) {
    const agent = await this.agentsRepository.updateAgent(agentId, input)
    if (!agent) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    return this.toAgentDetail(agent)
  }

  async addAllowedDomain(agentId: string, domain: string) {
    const agent = await this.agentsRepository.findAgentById(agentId)
    if (!agent) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    await this.agentsRepository.addAllowedDomain(agentId, domain)
    return this.getAgent(agentId)
  }

  async deleteAllowedDomain(agentId: string, domainId: string) {
    const domain = await this.agentsRepository.findDomainById(domainId)
    if (!domain || domain.agentId !== agentId) {
      throw new AppError(404, "DOMAIN_NOT_FOUND", "Allowed domain not found.")
    }

    await this.agentsRepository.deleteAllowedDomain(agentId, domainId)
    return { success: true }
  }

  async getAgentByPublicKey(agentKey: string) {
    const agent = await this.agentsRepository.findAgentByPublicKey(agentKey)
    if (!agent) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.")
    }

    return this.toAgentDetail(agent)
  }

  private async toAgentSummary(agent: {
    id: string
    name: string
    isActive: boolean
    publicAgentKey: string
    documentCount?: number
    conversationCount?: number
    updatedAt: string
  }) {
    return {
      id: agent.id,
      name: agent.name,
      publicAgentKey: `echo_pub_${agent.publicAgentKey}`,
      isActive: agent.isActive,
      documentCount: agent.documentCount ?? 0,
      conversationCount: agent.conversationCount ?? 0,
      updatedAt: new Date(agent.updatedAt).toISOString(),
    }
  }

  private async toAgentDetail(agent: {
    id: string
    name: string
    description: string
    greetingMessage: string
    primaryColor: string
    launcherPosition: "left" | "right"
    isActive: boolean
    publicAgentKey: string
  }) {
    const allowedDomains = await this.agentsRepository.listAllowedDomains(agent.id)

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      greetingMessage: agent.greetingMessage,
      primaryColor: agent.primaryColor,
      launcherPosition: agent.launcherPosition,
      allowedDomains,
      isActive: agent.isActive,
      publicAgentKey: `echo_pub_${agent.publicAgentKey}`,
    }
  }
}
