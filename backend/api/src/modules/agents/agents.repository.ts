import { pool } from "../../lib/db.js"

export type AgentRecord = {
  id: string
  orgId: string
  name: string
  description: string
  greetingMessage: string
  primaryColor: string
  launcherPosition: "left" | "right"
  isActive: boolean
  publicAgentKey: string
  updatedAt: string
  documentCount?: number
  conversationCount?: number
}

export class AgentsRepository {
  async ensureDefaultOrganization() {
    const existing = await pool.query<{ id: string; name: string; slug: string }>(
      `SELECT id, name, slug FROM organizations ORDER BY created_at ASC LIMIT 1`,
    )

    if (existing.rows[0]) {
      return existing.rows[0]
    }

    const created = await pool.query<{ id: string; name: string; slug: string }>(
      `
        INSERT INTO organizations (name, slug)
        VALUES ('Echo Demo Company', 'echo-demo-company')
        RETURNING id, name, slug
      `,
    )

    return created.rows[0]
  }

  async listAgents(): Promise<AgentRecord[]> {
    const result = await pool.query<AgentRecord>(
      `
        SELECT
          a.id,
          a.org_id AS "orgId",
          a.name,
          a.description,
          a.greeting_message AS "greetingMessage",
          a.primary_color AS "primaryColor",
          a.launcher_position AS "launcherPosition",
          a.is_active AS "isActive",
          a.public_api_key::text AS "publicAgentKey",
          a.updated_at AS "updatedAt",
          COUNT(DISTINCT d.id)::int AS "documentCount",
          COUNT(DISTINCT c.id)::int AS "conversationCount"
        FROM agents a
        LEFT JOIN documents d ON d.agent_id = a.id::text
        LEFT JOIN conversations c ON c.agent_id = a.id::text
        GROUP BY a.id
        ORDER BY a.updated_at DESC, a.created_at DESC
      `,
    )

    return result.rows
  }

  async findAgentById(agentId: string): Promise<AgentRecord | null> {
    const result = await pool.query<AgentRecord>(
      `
        SELECT
          id,
          org_id AS "orgId",
          name,
          description,
          greeting_message AS "greetingMessage",
          primary_color AS "primaryColor",
          launcher_position AS "launcherPosition",
          is_active AS "isActive",
          public_api_key::text AS "publicAgentKey",
          updated_at AS "updatedAt"
        FROM agents
        WHERE id = $1
        LIMIT 1
      `,
      [agentId],
    )

    return result.rows[0] ?? null
  }

  async findAgentByPublicKey(agentKey: string): Promise<AgentRecord | null> {
    const normalizedKey = agentKey.replace(/^echo_pub_/, "")
    const result = await pool.query<AgentRecord>(
      `
        SELECT
          id,
          org_id AS "orgId",
          name,
          description,
          greeting_message AS "greetingMessage",
          primary_color AS "primaryColor",
          launcher_position AS "launcherPosition",
          is_active AS "isActive",
          public_api_key::text AS "publicAgentKey",
          updated_at AS "updatedAt"
        FROM agents
        WHERE public_api_key::text = $1
        LIMIT 1
      `,
      [normalizedKey],
    )

    return result.rows[0] ?? null
  }

  async createAgent(input: {
    orgId: string
    name: string
    description: string
    greetingMessage: string
    primaryColor: string
    launcherPosition: "left" | "right"
  }): Promise<AgentRecord> {
    const result = await pool.query<AgentRecord>(
      `
        INSERT INTO agents (
          org_id,
          name,
          description,
          greeting_message,
          primary_color,
          launcher_position,
          system_prompt
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          org_id AS "orgId",
          name,
          description,
          greeting_message AS "greetingMessage",
          primary_color AS "primaryColor",
          launcher_position AS "launcherPosition",
          is_active AS "isActive",
          public_api_key::text AS "publicAgentKey",
          updated_at AS "updatedAt"
      `,
      [
        input.orgId,
        input.name,
        input.description,
        input.greetingMessage,
        input.primaryColor,
        input.launcherPosition,
        "You are Echo, a helpful customer support assistant grounded in uploaded documents.",
      ],
    )

    return result.rows[0]
  }

  async updateAgent(
    agentId: string,
    input: Partial<{
      name: string
      description: string
      greetingMessage: string
      primaryColor: string
      launcherPosition: "left" | "right"
      isActive: boolean
    }>,
  ): Promise<AgentRecord | null> {
    const current = await this.findAgentById(agentId)
    if (!current) {
      return null
    }

    const result = await pool.query<AgentRecord>(
      `
        UPDATE agents
        SET
          name = $2,
          description = $3,
          greeting_message = $4,
          primary_color = $5,
          launcher_position = $6,
          is_active = $7,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          org_id AS "orgId",
          name,
          description,
          greeting_message AS "greetingMessage",
          primary_color AS "primaryColor",
          launcher_position AS "launcherPosition",
          is_active AS "isActive",
          public_api_key::text AS "publicAgentKey",
          updated_at AS "updatedAt"
      `,
      [
        agentId,
        input.name ?? current.name,
        input.description ?? current.description,
        input.greetingMessage ?? current.greetingMessage,
        input.primaryColor ?? current.primaryColor,
        input.launcherPosition ?? current.launcherPosition,
        input.isActive ?? current.isActive,
      ],
    )

    return result.rows[0] ?? null
  }

  async listAllowedDomains(agentId: string): Promise<string[]> {
    const result = await pool.query<{ domain: string }>(
      `SELECT domain FROM allowed_domains WHERE agent_id = $1 ORDER BY domain ASC`,
      [agentId],
    )

    return result.rows.map((row) => row.domain)
  }

  async addAllowedDomain(agentId: string, domain: string) {
    await pool.query(
      `
        INSERT INTO allowed_domains (agent_id, domain)
        VALUES ($1, $2)
        ON CONFLICT (agent_id, domain) DO NOTHING
      `,
      [agentId, domain],
    )

    await this.syncAgentDomainCache(agentId)
  }

  async deleteAllowedDomain(agentId: string, domainId: string) {
    await pool.query(`DELETE FROM allowed_domains WHERE agent_id = $1 AND id = $2`, [agentId, domainId])
    await this.syncAgentDomainCache(agentId)
  }

  async findDomainById(domainId: string): Promise<{ id: string; agentId: string; domain: string } | null> {
    const result = await pool.query<{ id: string; agentId: string; domain: string }>(
      `
        SELECT id, agent_id AS "agentId", domain
        FROM allowed_domains
        WHERE id = $1
        LIMIT 1
      `,
      [domainId],
    )

    return result.rows[0] ?? null
  }

  private async syncAgentDomainCache(agentId: string) {
    await pool.query(
      `
        UPDATE agents
        SET allowed_domains = (
          SELECT COALESCE(jsonb_agg(domain ORDER BY domain), '[]'::jsonb)
          FROM allowed_domains
          WHERE agent_id = $1
        ),
        updated_at = NOW()
        WHERE id = $1
      `,
      [agentId],
    )
  }
}
