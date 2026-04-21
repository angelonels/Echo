import { Router } from "express"
import { WidgetController } from "../widget.controller.js"

const widgetController = new WidgetController()

export const widgetRouter = Router()

widgetRouter.get("/config", widgetController.getConfig)
widgetRouter.get("/config/:agentKey", widgetController.getConfig)
widgetRouter.post("/chat", widgetController.sendChat)
