import { AppError } from "../../lib/errors.js";
import { TracesRepository } from "./traces.repository.js";

export class TracesService {
  constructor(private readonly tracesRepository: TracesRepository) {}

  async listTraces(userId: string, agentId: string) {
    return {
      items: await this.tracesRepository.listTracesForAgent(userId, agentId),
    };
  }

  async getTrace(userId: string, agentId: string, traceId: string) {
    const trace = await this.tracesRepository.getTraceForAgent(userId, agentId, traceId);
    if (!trace) {
      throw new AppError(404, "TRACE_NOT_FOUND", "Retrieval trace not found.");
    }

    return trace;
  }
}
