import { Router } from "express";
import { TracesController } from "../traces.controller.js";
import { TracesRepository } from "../traces.repository.js";
import { TracesService } from "../traces.service.js";

const tracesRepository = new TracesRepository();
const tracesService = new TracesService(tracesRepository);
const tracesController = new TracesController(tracesService);

export const tracesRouter = Router({ mergeParams: true });

tracesRouter.get("/", tracesController.listTraces);
tracesRouter.get("/:traceId", tracesController.getTrace);
