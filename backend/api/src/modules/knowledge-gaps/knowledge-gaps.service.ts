import { KnowledgeGapsRepository } from "./knowledge-gaps.repository.js";

export class KnowledgeGapsService {
  constructor(private readonly knowledgeGapsRepository: KnowledgeGapsRepository) {}

  async listKnowledgeGaps(userId: string, agentId: string) {
    return {
      items: await this.knowledgeGapsRepository.listKnowledgeGapsForAgent(userId, agentId),
    };
  }
}
