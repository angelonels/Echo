import { AppError } from "../../lib/errors.js";
import { AgentsRepository, type AgentRecord, type AgentWriteInput } from "./agents.repository.js";

export class AgentsService {
  constructor(private readonly agentsRepository: AgentsRepository) {}

  async listAgents(userId: string) {
    const agents = await this.agentsRepository.listAgentsForUser(userId);
    return {
      items: agents.map((agent) => this.toAgentSummary(agent)),
    };
  }

  async getAgent(userId: string, agentId: string) {
    const agent = await this.findAgentOrThrow(userId, agentId);
    return this.toAgentDetail(agent, await this.agentsRepository.listAllowedDomainsForUser(userId, agentId));
  }

  async createAgent(userId: string, input: AgentWriteInput) {
    const agent = await this.agentsRepository.createAgentForUser(userId, input);
    return this.toAgentDetail(agent, []);
  }

  async updateAgent(userId: string, agentId: string, input: Partial<AgentWriteInput>) {
    const agent = await this.agentsRepository.updateAgentForUser(userId, agentId, input);
    if (!agent) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }

    return this.toAgentDetail(agent, await this.agentsRepository.listAllowedDomainsForUser(userId, agentId));
  }

  async deleteAgent(userId: string, agentId: string) {
    const deleted = await this.agentsRepository.archiveAgentForUser(userId, agentId);
    if (!deleted) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }

    return { success: true };
  }

  async getAgentByPublicKey(agentKey: string) {
    const agent = await this.agentsRepository.findAgentByPublicKey(agentKey);
    if (!agent || agent.status === "archived") {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }

    return this.toAgentDetail(agent, await this.agentsRepository.listAllowedDomainsForUser(agent.userId, agent.id));
  }

  private async findAgentOrThrow(userId: string, agentId: string) {
    const agent = await this.agentsRepository.findAgentForUser(userId, agentId);
    if (!agent) {
      throw new AppError(404, "AGENT_NOT_FOUND", "Agent not found.");
    }

    return agent;
  }

  private toAgentSummary(agent: AgentRecord) {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      publicAgentKey: agent.publicAgentKey,
      status: agent.status,
      visibility: agent.visibility,
      welcomeMessage: agent.welcomeMessage,
      retrievalMode: agent.retrievalMode,
      modelProvider: agent.modelProvider,
      generationModel: agent.generationModel,
      embeddingModel: agent.embeddingModel,
      documentCount: agent.documentCount ?? 0,
      conversationCount: agent.conversationCount ?? 0,
      updatedAt: new Date(agent.updatedAt).toISOString(),
      isActive: agent.status === "active",
    };
  }

  private toAgentDetail(agent: AgentRecord, allowedDomains: Array<{ id: string; domain: string }>) {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      publicAgentKey: agent.publicAgentKey,
      status: agent.status,
      visibility: agent.visibility,
      baseInstructions: agent.baseInstructions,
      welcomeMessage: agent.welcomeMessage,
      fallbackMessage: agent.fallbackMessage,
      retrievalMode: agent.retrievalMode,
      temperature: Number(agent.temperature),
      maxContextChunks: agent.maxContextChunks,
      modelProvider: agent.modelProvider,
      generationModel: agent.generationModel,
      embeddingModel: agent.embeddingModel,
      allowedDomains,
      createdAt: new Date(agent.createdAt).toISOString(),
      updatedAt: new Date(agent.updatedAt).toISOString(),
      greetingMessage: agent.welcomeMessage ?? "Hi. Ask me anything about this product.",
      primaryColor: "#0f8f7f",
      launcherPosition: "right",
      isActive: agent.status === "active",
    };
  }
}
