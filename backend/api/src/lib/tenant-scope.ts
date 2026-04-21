import { and, eq } from "drizzle-orm";
import { db } from "./db.js";
import { agents, organizations } from "./schema.js";

export async function resolveAgentScope(companyLabel: string, agentLabel: string) {
  const normalizedCompany = companyLabel.trim() || "default-company";
  const normalizedAgent = agentLabel.trim() || "default-agent";

  let [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, normalizedCompany))
    .limit(1);

  if (!organization) {
    [organization] = await db
      .insert(organizations)
      .values({ name: normalizedCompany })
      .returning();
  }

  let [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.orgId, organization.id), eq(agents.name, normalizedAgent)))
    .limit(1);

  if (!agent) {
    [agent] = await db
      .insert(agents)
      .values({
        orgId: organization.id,
        name: normalizedAgent,
        systemPrompt: "You are Echo, a helpful customer support assistant.",
      })
      .returning();
  }

  return {
    companyScope: normalizedCompany,
    organizationId: organization.id,
    agentId: agent.id,
    agentName: agent.name,
  };
}
