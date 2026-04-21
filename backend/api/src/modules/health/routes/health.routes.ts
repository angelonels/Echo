import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    status: "ok",
    service: "api",
  });
});

healthRouter.get("/ready", (_request, response) => {
  response.json({
    status: "ready",
    service: "api",
  });
});
