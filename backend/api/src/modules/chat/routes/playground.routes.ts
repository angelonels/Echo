import { Router } from "express"
import { ChatController } from "../chat.controller.js"
import { ChatRepository } from "../chat.repository.js"
import { ChatService } from "../chat.service.js"

const chatRepository = new ChatRepository()
const chatService = new ChatService(chatRepository)
const chatController = new ChatController(chatService)

export const playgroundChatRouter = Router({ mergeParams: true })

playgroundChatRouter.post("/chat", chatController.sendPlaygroundMessage)
playgroundChatRouter.get("/conversations/:conversationId", chatController.getPlaygroundConversation)
