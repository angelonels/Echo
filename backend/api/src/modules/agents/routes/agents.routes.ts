import { Router } from "express"
import { AgentsController } from "../agents.controller.js"
import { AgentsRepository } from "../agents.repository.js"
import { AgentsService } from "../agents.service.js"

const agentsRepository = new AgentsRepository()
const agentsService = new AgentsService(agentsRepository)
const agentsController = new AgentsController(agentsService)

export const agentsRouter = Router()

agentsRouter.get("/", agentsController.listAgents)
agentsRouter.post("/", agentsController.createAgent)
agentsRouter.get("/:agentId", agentsController.getAgent)
agentsRouter.patch("/:agentId", agentsController.updateAgent)
agentsRouter.post("/:agentId/domains", agentsController.addAllowedDomain)
agentsRouter.delete("/:agentId/domains/:domainId", agentsController.deleteAllowedDomain)
