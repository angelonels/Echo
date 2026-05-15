import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireAuth } from "../src/lib/auth.js";
import { AgentsService } from "../src/modules/agents/agents.service.js";
import type { AgentRecord } from "../src/modules/agents/agents.repository.js";

function agent(overrides: Partial<AgentRecord> = {}): AgentRecord {
  return {
    id: "6bd693a9-8f78-4939-a375-c5ed935f0107",
    userId: "247daf73-2d79-4bd7-87cb-b1d431984936",
    name: "Acme Support",
    description: "Answers questions from Acme support docs.",
    publicAgentKey: "agent_pub_test",
    status: "draft",
    visibility: "private",
    baseInstructions: "Only answer from uploaded docs.",
    welcomeMessage: "Ask me about Acme.",
    fallbackMessage: "I do not have enough information to answer.",
    retrievalMode: "auto",
    temperature: "0.2",
    maxContextChunks: 6,
    modelProvider: "bedrock",
    generationModel: "amazon.nova-lite-v1:0",
    embeddingModel: "amazon.titan-embed-text-v2:0",
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    ...overrides,
  };
}

describe("Phase 1 backend foundation", () => {
  it("rejects protected requests without a bearer token before touching user-owned data", async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const response = { status, json } as unknown as Response;
    const next = vi.fn() as NextFunction;

    await requireAuth({ headers: {} } as Request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "UNAUTHORIZED" }),
      }),
    );
  });

  it("maps user-owned agents without accepting frontend user identity", async () => {
    const repository = {
      listAgentsForUser: vi.fn().mockResolvedValue([agent({ status: "active" })]),
    };
    const service = new AgentsService(repository as never);

    const result = await service.listAgents("247daf73-2d79-4bd7-87cb-b1d431984936");

    expect(repository.listAgentsForUser).toHaveBeenCalledWith("247daf73-2d79-4bd7-87cb-b1d431984936");
    expect(result.items[0]).toMatchObject({
      id: "6bd693a9-8f78-4939-a375-c5ed935f0107",
      publicAgentKey: "agent_pub_test",
      status: "active",
      isActive: true,
    });
  });

  it("normalizes allowed domains and scopes writes by user id and agent id", async () => {
    const repository = {
      findAgentForUser: vi.fn().mockResolvedValue(agent()),
      addAllowedDomainForUser: vi.fn().mockResolvedValue(undefined),
      listAllowedDomainsForUser: vi.fn().mockResolvedValue([{ id: "domain-1", domain: "example.com" }]),
    };
    const service = new AgentsService(repository as never);

    const result = await service.addAllowedDomain(
      "247daf73-2d79-4bd7-87cb-b1d431984936",
      "6bd693a9-8f78-4939-a375-c5ed935f0107",
      "https://Example.com/docs/",
    );

    expect(repository.findAgentForUser).toHaveBeenCalledWith(
      "247daf73-2d79-4bd7-87cb-b1d431984936",
      "6bd693a9-8f78-4939-a375-c5ed935f0107",
    );
    expect(repository.addAllowedDomainForUser).toHaveBeenCalledWith(
      "247daf73-2d79-4bd7-87cb-b1d431984936",
      "6bd693a9-8f78-4939-a375-c5ed935f0107",
      "example.com",
    );
    expect(result.allowedDomains).toEqual([{ id: "domain-1", domain: "example.com" }]);
  });
});
