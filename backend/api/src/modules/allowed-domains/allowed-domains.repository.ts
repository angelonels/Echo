import { pool } from "../../lib/db.js";

export type AllowedDomainRecord = {
  id: string;
  domain: string;
  createdAt: string;
};

export class AllowedDomainsRepository {
  async assertAgentForUser(userId: string, agentId: string): Promise<boolean> {
    const result = await pool.query(`SELECT 1 FROM agents WHERE id = $1 AND user_id = $2 AND status <> 'archived'`, [
      agentId,
      userId,
    ]);

    return Boolean(result.rowCount);
  }

  async listAllowedDomainsForUser(userId: string, agentId: string): Promise<AllowedDomainRecord[]> {
    const result = await pool.query<AllowedDomainRecord>(
      `
        SELECT id, domain, created_at AS "createdAt"
        FROM allowed_domains
        WHERE user_id = $1 AND agent_id = $2
        ORDER BY domain ASC
      `,
      [userId, agentId],
    );

    return result.rows;
  }

  async addAllowedDomainForUser(userId: string, agentId: string, domain: string): Promise<AllowedDomainRecord> {
    const result = await pool.query<AllowedDomainRecord>(
      `
        INSERT INTO allowed_domains (user_id, agent_id, domain)
        VALUES ($1, $2, $3)
        ON CONFLICT (agent_id, domain) DO UPDATE SET domain = EXCLUDED.domain
        RETURNING id, domain, created_at AS "createdAt"
      `,
      [userId, agentId, domain],
    );

    return result.rows[0];
  }

  async deleteAllowedDomainForUser(userId: string, agentId: string, domainId: string): Promise<boolean> {
    const result = await pool.query(
      `
        DELETE FROM allowed_domains
        WHERE user_id = $1 AND agent_id = $2 AND id = $3
      `,
      [userId, agentId, domainId],
    );

    return Boolean(result.rowCount);
  }
}
