import { Router } from "express"
import { AuthController } from "../auth.controller.js"
import { AuthRepository } from "../auth.repository.js"
import { AuthService } from "../auth.service.js"

const authRepository = new AuthRepository()
const authService = new AuthService(authRepository)
const authController = new AuthController(authService)

export const authRouter = Router()

authRouter.post("/signup", authController.signup)
authRouter.post("/login", authController.login)
authRouter.post("/refresh", authController.refresh)
authRouter.get("/me", authController.me)
