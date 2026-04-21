import { pool } from "../../lib/db.js"

export type AuthUserRecord = {
  id: string
  orgId: string
  email: string
  passwordHash: string
  fullName: string
  role: "OWNER" | "ADMIN"
  companyName: string
  companySlug: string
}

export class AuthRepository {
  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const result = await pool.query<AuthUserRecord>(
      `
        SELECT
          u.id,
          u.org_id AS "orgId",
          u.email,
          u.password_hash AS "passwordHash",
          u.full_name AS "fullName",
          u.role,
          o.name AS "companyName",
          o.slug AS "companySlug"
        FROM admin_users u
        JOIN organizations o ON o.id = u.org_id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    )

    return result.rows[0] ?? null
  }

  async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const result = await pool.query<AuthUserRecord>(
      `
        SELECT
          u.id,
          u.org_id AS "orgId",
          u.email,
          u.password_hash AS "passwordHash",
          u.full_name AS "fullName",
          u.role,
          o.name AS "companyName",
          o.slug AS "companySlug"
        FROM admin_users u
        JOIN organizations o ON o.id = u.org_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId],
    )

    return result.rows[0] ?? null
  }

  async createOrganizationWithOwner(input: {
    companyName: string
    companySlug: string
    email: string
    passwordHash: string
    fullName: string
  }): Promise<AuthUserRecord> {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      const organizationResult = await client.query<{ id: string; name: string; slug: string }>(
        `
          INSERT INTO organizations (name, slug)
          VALUES ($1, $2)
          RETURNING id, name, slug
        `,
        [input.companyName, input.companySlug],
      )

      const organization = organizationResult.rows[0]
      const userResult = await client.query<AuthUserRecord>(
        `
          INSERT INTO admin_users (org_id, email, password_hash, full_name, role)
          VALUES ($1, $2, $3, $4, 'OWNER')
          RETURNING
            id,
            org_id AS "orgId",
            email,
            password_hash AS "passwordHash",
            full_name AS "fullName",
            role
        `,
        [organization.id, input.email.toLowerCase(), input.passwordHash, input.fullName],
      )

      await client.query("COMMIT")

      return {
        ...userResult.rows[0],
        companyName: organization.name,
        companySlug: organization.slug,
      }
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }
}
