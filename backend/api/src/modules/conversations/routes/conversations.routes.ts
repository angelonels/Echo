import { Router } from "express"
import { ConversationsController } from "../conversations.controller.js"
import { ConversationsRepository } from "../conversations.repository.js"
import { ConversationsService } from "../conversations.service.js"

const conversationsRepository = new ConversationsRepository()
const conversationsService = new ConversationsService(conversationsRepository)
const conversationsController = new ConversationsController(conversationsService)

export const conversationsRouter = Router({ mergeParams: true })

conversationsRouter.get("/", conversationsController.listConversations)
conversationsRouter.get("/:conversationId", conversationsController.getConversation)
