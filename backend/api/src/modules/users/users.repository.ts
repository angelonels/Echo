import { pool } from "../../lib/db.js";

export type UserRecord = {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertUserInput = {
  clerkUserId: string;
  email?: string | null;
  name?: string | null;
  imageUrl?: string | null;
};

export class UsersRepository {
  async upsertFromAuthProvider(input: UpsertUserInput): Promise<UserRecord> {
    const result = await pool.query<UserRecord>(
      `
        INSERT INTO users (clerk_user_id, email, name, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (clerk_user_id) DO UPDATE
        SET
          email = COALESCE(EXCLUDED.email, users.email),
          name = COALESCE(EXCLUDED.name, users.name),
          image_url = COALESCE(EXCLUDED.image_url, users.image_url),
          updated_at = NOW()
        RETURNING
          id,
          clerk_user_id AS "clerkUserId",
          email,
          name,
          image_url AS "imageUrl",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [input.clerkUserId, input.email ?? null, input.name ?? null, input.imageUrl ?? null],
    );

    return result.rows[0];
  }

  async findByClerkUserId(clerkUserId: string): Promise<UserRecord | null> {
    const result = await pool.query<UserRecord>(
      `
        SELECT
          id,
          clerk_user_id AS "clerkUserId",
          email,
          name,
          image_url AS "imageUrl",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM users
        WHERE clerk_user_id = $1
        LIMIT 1
      `,
      [clerkUserId],
    );

    return result.rows[0] ?? null;
  }
}
