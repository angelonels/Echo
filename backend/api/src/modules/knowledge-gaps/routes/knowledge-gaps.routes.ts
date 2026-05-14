import { Router } from "express";
import { KnowledgeGapsController } from "../knowledge-gaps.controller.js";
import { KnowledgeGapsRepository } from "../knowledge-gaps.repository.js";
import { KnowledgeGapsService } from "../knowledge-gaps.service.js";

const knowledgeGapsRepository = new KnowledgeGapsRepository();
const knowledgeGapsService = new KnowledgeGapsService(knowledgeGapsRepository);
const knowledgeGapsController = new KnowledgeGapsController(knowledgeGapsService);

export const knowledgeGapsRouter = Router({ mergeParams: true });

knowledgeGapsRouter.get("/", knowledgeGapsController.listKnowledgeGaps);
