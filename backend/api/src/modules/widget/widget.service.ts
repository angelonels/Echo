import { AppError } from "../../lib/errors.js";
import type { PublicAgentScope } from "../../lib/public-agent-scope.js";
import { isOriginAllowed } from "./origin-validator.js";

export class WidgetService {
  assertWidgetCanRun(agent: PublicAgentScope, origin: string | undefined) {
    if (!agent.isActive) {
      throw new AppError(409, "AGENT_PAUSED", "This support agent is not active.");
    }

    if (!isOriginAllowed(origin, agent.allowedDomains)) {
      throw new AppError(403, "DOMAIN_NOT_ALLOWED", "This domain is not allowed to use this widget.");
    }
  }
}
