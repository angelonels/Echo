import { Router } from "express";
import { AllowedDomainsController } from "../allowed-domains.controller.js";
import { AllowedDomainsRepository } from "../allowed-domains.repository.js";
import { AllowedDomainsService } from "../allowed-domains.service.js";

const allowedDomainsRepository = new AllowedDomainsRepository();
const allowedDomainsService = new AllowedDomainsService(allowedDomainsRepository);
const allowedDomainsController = new AllowedDomainsController(allowedDomainsService);

export const allowedDomainsRouter = Router({ mergeParams: true });

allowedDomainsRouter.get("/", allowedDomainsController.listAllowedDomains);
allowedDomainsRouter.post("/", allowedDomainsController.addAllowedDomain);
allowedDomainsRouter.delete("/:domainId", allowedDomainsController.deleteAllowedDomain);
