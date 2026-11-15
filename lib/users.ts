import 'server-only'
import { pool } from '@/lib/db'

export interface DbUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
}

/**
 * Find or create the app user for an OAuth identity. Replaces Supabase's
 * auth.identities lookup and the handle_new_user() trigger.
 *
 * 1. Known identity (provider + account id)  -> that user
 * 2. Existing user with the same email       -> link the identity to it
 * 3. Otherwise                               -> create user + identity
 */
export async function upsertOAuthUser(input: {
  provider: string
  providerAccountId: string
  email: string
  name?: string | null
  image?: string | null
}): Promise<DbUser> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const linked = await client.query<DbUser>(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.is_admin
         FROM auth_accounts a JOIN users u ON u.id = a.user_id
        WHERE a.provider = $1 AND a.provider_account_id = $2`,
      [input.provider, input.providerAccountId]
    )
    let user = linked.rows[0]

    if (!user) {
      const byEmail = await client.query<DbUser>(
        `SELECT id, email, full_name, avatar_url, is_admin
           FROM users WHERE lower(email) = lower($1)`,
        [input.email]
      )
      user = byEmail.rows[0]

      if (!user) {
        const created = await client.query<DbUser>(
          `INSERT INTO users (email, full_name, avatar_url)
           VALUES ($1, $2, $3)
           RETURNING id, email, full_name, avatar_url, is_admin`,
          [input.email, input.name ?? null, input.image ?? null]
        )
        user = created.rows[0]
      }

      await client.query(
        `INSERT INTO auth_accounts (provider, provider_account_id, user_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [input.provider, input.providerAccountId, user.id]
      )
    }

    // Fill in profile fields that were missing (never overwrite what the user has).
    if ((!user.full_name && input.name) || (!user.avatar_url && input.image)) {
      const updated = await client.query<DbUser>(
        `UPDATE users SET full_name = COALESCE(full_name, $2), avatar_url = COALESCE(avatar_url, $3)
          WHERE id = $1 RETURNING id, email, full_name, avatar_url, is_admin`,
        [user.id, input.name ?? null, input.image ?? null]
      )
      user = updated.rows[0]
    }

    await client.query('COMMIT')
    return user
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
