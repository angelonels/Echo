import { pool } from "./db.js";

export type PublicAgentScope = {
  userId: string;
  agentId: string;
  agentName: string;
  greetingMessage: string;
  primaryColor: string;
  launcherPosition: "left" | "right";
  isActive: boolean;
  publicAgentKey: string;
  allowedDomains: string[];
};

function normalizePublicAgentKey(agentKey: string) {
  return agentKey.trim().replace(/^echo_pub_/, "");
}

function normalizeAllowedDomains(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapPublicAgentScope(row: Record<string, unknown> | undefined): PublicAgentScope | null {
  if (!row) {
    return null;
  }

  return {
    userId: String(row.userId),
    agentId: String(row.agentId),
    agentName: String(row.agentName),
    greetingMessage: String(row.greetingMessage),
    primaryColor: String(row.primaryColor),
    launcherPosition: row.launcherPosition === "left" ? "left" : "right",
    isActive: Boolean(row.isActive),
    publicAgentKey: String(row.publicAgentKey),
    allowedDomains: normalizeAllowedDomains(row.allowedDomains),
  };
}

export async function findPublicAgentScopeByKey(agentKey: string): Promise<PublicAgentScope | null> {
  const result = await pool.query(
    `
      SELECT
        a.user_id::text AS "userId",
        a.id::text AS "agentId",
        a.name AS "agentName",
        COALESCE(a.welcome_message, a.greeting_message) AS "greetingMessage",
        a.primary_color AS "primaryColor",
        a.launcher_position AS "launcherPosition",
        (a.status = 'active') AS "isActive",
        a.public_agent_key AS "publicAgentKey",
        COALESCE(
          (
            SELECT jsonb_agg(domain ORDER BY domain)
            FROM allowed_domains
            WHERE agent_id = a.id
          ),
          a.allowed_domains,
          '[]'::jsonb
        ) AS "allowedDomains"
      FROM agents a
      WHERE a.public_agent_key = $1
        AND a.status <> 'archived'
      LIMIT 1
    `,
    [normalizePublicAgentKey(agentKey)],
  );

  return mapPublicAgentScope(result.rows[0]);
}
