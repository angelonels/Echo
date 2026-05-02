import { Router } from "express";
import { requireAuth } from "../../../lib/auth.js";
import { AuthController } from "../auth.controller.js";

const authController = new AuthController();

export const authRouter = Router();

authRouter.post("/signup", (_request, response) => {
  response.status(410).json({
    error: {
      code: "LEGACY_AUTH_DISABLED",
      message: "Password signup is disabled. Use Clerk Google OAuth or email magic links.",
    },
  });
});

authRouter.post("/login", (_request, response) => {
  response.status(410).json({
    error: {
      code: "LEGACY_AUTH_DISABLED",
      message: "Password login is disabled. Use Clerk Google OAuth or email magic links.",
    },
  });
});

authRouter.post("/refresh", (_request, response) => {
  response.status(410).json({
    error: {
      code: "LEGACY_AUTH_DISABLED",
      message: "JWT refresh is disabled. Use Clerk session tokens.",
    },
  });
});

authRouter.get("/me", requireAuth, authController.me);
