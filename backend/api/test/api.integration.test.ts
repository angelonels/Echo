import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import request, { type SuperTest, type Test } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

type WorkerModules = {
  documentIngestionWorker: { close: () => Promise<void> };
  chatAnalyticsWorker: { close: () => Promise<void> };
  workerPool: { end: () => Promise<void> };
  workerRedisConnection: { quit: () => Promise<void> };
};

type ApiModules = {
  createApp: () => unknown;
  initDb: () => Promise<void>;
  apiPool: {
    query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
    end: () => Promise<void>;
  };
  apiRedisConnection: { quit: () => Promise<void> };
  documentsQueue: { close: () => Promise<void> };
  analyticsQueue: { close: () => Promise<void> };
  maintenanceQueue: { close: () => Promise<void> };
  ensureUploadRoot: () => Promise<void>;
};

type TestCompany = {
  id: string;
  slug: string;
};

const fixturePath = path.resolve(import.meta.dirname, "./fixtures/hf-widget-guide.txt");

let api: ApiModules;
let workers: WorkerModules;
let client: SuperTest<Test>;
const cleanupTargets: TestCompany[] = [];

function uniqueEmail(prefix: string) {
  return `${prefix}-${randomUUID()}@echo.test`;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function waitFor<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 30000,
  intervalMs = 500,
) {
  const startedAt = Date.now();

  for (;;) {
    const value = await fn();
    if (predicate(value)) {
      return value;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error("Timed out while waiting for condition.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

async function cleanupCompany(company: TestCompany) {
  const uploadedFiles = await api.apiPool.query<{ storagePath: string }>(
    `SELECT storage_path AS "storagePath" FROM documents WHERE company_id = $1`,
    [company.slug],
  );

  await api.apiPool.query(`DELETE FROM analytics_logs WHERE company_id = $1`, [company.slug]);
  await api.apiPool.query(`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE company_id = $1)`, [
    company.slug,
  ]);
  await api.apiPool.query(`DELETE FROM conversations WHERE company_id = $1`, [company.slug]);
  await api.apiPool.query(`DELETE FROM documents WHERE company_id = $1`, [company.slug]);
  await api.apiPool.query(`DELETE FROM organizations WHERE id = $1`, [company.id]);

  await Promise.all(
    uploadedFiles.rows.map(async ({ storagePath }) => {
      await fs.rm(storagePath, { force: true });
    }),
  );
}

describe.skip("Legacy organization/JWT API integration", () => {
  beforeAll(async () => {
    const [{ createApp }, { initDb, pool, redisConnection, documentsQueue, analyticsQueue, maintenanceQueue }, { ensureUploadRoot }] =
      await Promise.all([
        import("../src/app/create-app.js"),
        import("../src/lib/db.js").then(async ({ initDb, pool }) => {
          const { redisConnection, documentsQueue, analyticsQueue, maintenanceQueue } = await import("../src/lib/queues.js");
          return { initDb, pool, redisConnection, documentsQueue, analyticsQueue, maintenanceQueue };
        }),
        import("../src/lib/uploads.js"),
      ]);

    const [{ documentIngestionWorker }, { chatAnalyticsWorker }, { pool: workerPool }, { redisConnection: workerRedisConnection }] =
      await Promise.all([
        import("../../worker/src/jobs/document-ingestion.ts"),
        import("../../worker/src/jobs/chat-analytics.ts"),
        import("../../worker/src/lib/db.ts"),
        import("../../worker/src/lib/queues.ts"),
      ]);

    api = {
      createApp,
      initDb,
      apiPool: pool,
      apiRedisConnection: redisConnection,
      documentsQueue,
      analyticsQueue,
      maintenanceQueue,
      ensureUploadRoot,
    };
    workers = {
      documentIngestionWorker,
      chatAnalyticsWorker,
      workerPool,
      workerRedisConnection,
    };

    await api.ensureUploadRoot();
    await api.initDb();
    client = request(api.createApp() as Parameters<typeof request>[0]);
  });

  beforeEach(async () => {
    while (cleanupTargets.length > 0) {
      const target = cleanupTargets.pop();
      if (target) {
        await cleanupCompany(target);
      }
    }
  });

  afterAll(async () => {
    while (cleanupTargets.length > 0) {
      const target = cleanupTargets.pop();
      if (target) {
        await cleanupCompany(target);
      }
    }

    if (workers) {
      await workers.documentIngestionWorker.close();
      await workers.chatAnalyticsWorker.close();
      await workers.workerRedisConnection.quit();
      await workers.workerPool.end();
    }

    if (api) {
      await api.documentsQueue.close();
      await api.analyticsQueue.close();
      await api.maintenanceQueue.close();
      await api.apiRedisConnection.quit();
      await api.apiPool.end();
    }
  });

  it("rejects protected routes without a bearer token", async () => {
    const response = await client.get("/api/v1/agents");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("supports auth, enforces tenant isolation, and protects agent resources", async () => {
    const signupOne = await client.post("/api/v1/auth/signup").send({
      companyName: "Echo Integration Tenant One",
      fullName: "Tenant One Owner",
      email: uniqueEmail("tenant-one"),
      password: "Password123!",
    });

    expect(signupOne.status).toBe(201);
    cleanupTargets.push(signupOne.body.company);

    const tokenOne = signupOne.body.tokens.accessToken as string;
    const me = await client.get("/api/v1/auth/me").set(authHeader(tokenOne));
    expect(me.status).toBe(200);
    expect(me.body.company.id).toBe(signupOne.body.company.id);

    const createdAgent = await client
      .post("/api/v1/agents")
      .set(authHeader(tokenOne))
      .send({
        name: "Tenant One Agent",
        description: "Support agent for tenant one integration coverage.",
        greetingMessage: "Hello from tenant one support.",
        primaryColor: "#11b5a4",
        launcherPosition: "right",
      });

    expect(createdAgent.status).toBe(201);

    const signupTwo = await client.post("/api/v1/auth/signup").send({
      companyName: "Echo Integration Tenant Two",
      fullName: "Tenant Two Owner",
      email: uniqueEmail("tenant-two"),
      password: "Password123!",
    });

    expect(signupTwo.status).toBe(201);
    cleanupTargets.push(signupTwo.body.company);

    const tokenTwo = signupTwo.body.tokens.accessToken as string;
    const forbiddenAgentRead = await client
      .get(`/api/v1/agents/${createdAgent.body.id}`)
      .set(authHeader(tokenTwo));

    expect(forbiddenAgentRead.status).toBe(404);

    const forbiddenDocumentRead = await client
      .get(`/api/v1/agents/${createdAgent.body.id}/documents`)
      .set(authHeader(tokenTwo));

    expect(forbiddenDocumentRead.status).toBe(404);
  });

  it("ingests uploaded docs, retrieves grounded answers, and writes analytics", async () => {
    const signup = await client.post("/api/v1/auth/signup").send({
      companyName: "Echo Integration Knowledge Tenant",
      fullName: "Knowledge Owner",
      email: uniqueEmail("knowledge-owner"),
      password: "Password123!",
    });

    expect(signup.status).toBe(201);
    cleanupTargets.push(signup.body.company);

    const token = signup.body.tokens.accessToken as string;
    const createAgentResponse = await client
      .post("/api/v1/agents")
      .set(authHeader(token))
      .send({
        name: "Knowledge Agent",
        description: "Agent used for ingestion and retrieval integration testing.",
        greetingMessage: "Ask me about the uploaded knowledge.",
        primaryColor: "#1144aa",
        launcherPosition: "right",
      });

    expect(createAgentResponse.status).toBe(201);
    const agentId = createAgentResponse.body.id as string;

    const uploadResponse = await client
      .post(`/api/v1/agents/${agentId}/documents`)
      .set(authHeader(token))
      .attach("file", fixturePath);

    expect(uploadResponse.status).toBe(202);
    expect(uploadResponse.body.document.status).toBe("UPLOADED");

    const documentId = uploadResponse.body.document.id as string;

    const readyDocuments = await waitFor(
      async () =>
        client
          .get(`/api/v1/agents/${agentId}/documents`)
          .set(authHeader(token))
          .then((response) => response.body.items as Array<{ id: string; status: string }>),
      (items) => items.some((item) => item.id === documentId && item.status === "READY"),
      45000,
      750,
    );

    expect(readyDocuments.some((item) => item.id === documentId)).toBe(true);

    const chunkRows = await api.apiPool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM knowledge_chunks WHERE doc_id = $1`,
      [documentId],
    );
    expect(Number(chunkRows.rows[0]?.count ?? 0)).toBeGreaterThan(0);

    const chatResponse = await client
      .post(`/api/v1/agents/${agentId}/playground/chat`)
      .set(authHeader(token))
      .send({
        message: "In the uploaded guide, where does Clara live?",
      });

    expect(chatResponse.status).toBe(200);
    expect(chatResponse.body.meta.fallbackUsed).toBe(false);
    expect(chatResponse.body.message.content).toMatch(/berkeley|clara/i);

    const conversationId = chatResponse.body.conversationId as string;
    expect(conversationId).toBeTruthy();

    const analyticsSummary = await waitFor(
      async () =>
        client
          .get(`/api/v1/agents/${agentId}/analytics/summary`)
          .set(authHeader(token))
          .then((response) => response.body as { totalConversations: number; totalMessages: number }),
      (summary) => summary.totalConversations >= 1 && summary.totalMessages >= 2,
      30000,
      500,
    );

    expect(analyticsSummary.totalConversations).toBeGreaterThanOrEqual(1);
    expect(analyticsSummary.totalMessages).toBeGreaterThanOrEqual(2);

    const topQuestions = await waitFor(
      async () =>
        client
          .get(`/api/v1/agents/${agentId}/analytics/top-questions`)
          .set(authHeader(token))
          .then((response) => response.body.items as Array<{ question: string; count: number }>),
      (items) => items.some((item) => /clara/i.test(item.question)),
      30000,
      500,
    );

    expect(topQuestions[0].count).toBeGreaterThanOrEqual(1);

    const conversationResponse = await client
      .get(`/api/v1/agents/${agentId}/conversations/${conversationId}`)
      .set(authHeader(token));

    expect(conversationResponse.status).toBe(200);
    expect(conversationResponse.body.messages).toHaveLength(2);
  });

  it("serves widget config publicly and blocks chat from disallowed origins", async () => {
    const signup = await client.post("/api/v1/auth/signup").send({
      companyName: "Echo Integration Widget Tenant",
      fullName: "Widget Owner",
      email: uniqueEmail("widget-owner"),
      password: "Password123!",
    });

    expect(signup.status).toBe(201);
    cleanupTargets.push(signup.body.company);

    const token = signup.body.tokens.accessToken as string;
    const createAgentResponse = await client
      .post("/api/v1/agents")
      .set(authHeader(token))
      .send({
        name: "Widget Agent",
        description: "Agent used for widget domain controls and public config testing.",
        greetingMessage: "Public widget greeting.",
        primaryColor: "#6611aa",
        launcherPosition: "left",
      });

    expect(createAgentResponse.status).toBe(201);
    const agentId = createAgentResponse.body.id as string;
    const publicAgentKey = createAgentResponse.body.publicAgentKey as string;

    const addDomainResponse = await client
      .post(`/api/v1/agents/${agentId}/domains`)
      .set(authHeader(token))
      .send({ domain: "example.com" });

    expect(addDomainResponse.status).toBe(201);

    const uploadResponse = await client
      .post(`/api/v1/agents/${agentId}/documents`)
      .set(authHeader(token))
      .attach("file", fixturePath);

    expect(uploadResponse.status).toBe(202);

    await waitFor(
      async () =>
        client
          .get(`/api/v1/agents/${agentId}/documents`)
          .set(authHeader(token))
          .then((response) => response.body.items as Array<{ status: string }>),
      (items) => items.some((item) => item.status === "READY"),
      45000,
      750,
    );

    const widgetConfigResponse = await client.get(`/api/v1/widget/config/${publicAgentKey}`);
    expect(widgetConfigResponse.status).toBe(200);
    expect(widgetConfigResponse.body.allowedDomains).toContain("example.com");

    const blockedWidgetChat = await client
      .post("/api/v1/widget/chat")
      .set("Origin", "https://blocked.example")
      .send({
        agentKey: publicAgentKey,
        sessionId: `session-${randomUUID()}`,
        message: "Where does Clara live?",
      });

    expect(blockedWidgetChat.status).toBe(403);
    expect(blockedWidgetChat.body.error.code).toBe("DOMAIN_NOT_ALLOWED");

    const allowedWidgetChat = await client
      .post("/api/v1/widget/chat")
      .set("Origin", "https://example.com")
      .send({
        agentKey: publicAgentKey,
        sessionId: `session-${randomUUID()}`,
        message: "Where does Clara live?",
      });

    expect(allowedWidgetChat.status).toBe(200);
    expect(allowedWidgetChat.text).toContain("[DONE]");
    expect(allowedWidgetChat.text).toMatch(/berkeley|clara/i);
  });
});
