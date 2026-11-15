import 'server-only'
import { queryOne } from '@/lib/db'

interface KarmaRow { id: string; karma: number }

/** Atomically add karma to a user. */
export async function awardKarma(userId: string, amount: number, reason: string) {
  if (!userId) return null
  console.log(`Awarding ${amount} karma to ${userId} for: ${reason}`)
  try {
    return await queryOne<KarmaRow>(
      `UPDATE users SET karma = COALESCE(karma, 0) + $2 WHERE id = $1 RETURNING id, karma`,
      [userId, amount]
    )
  } catch (error) {
    console.error('Error updating karma:', error)
    return null
  }
}

/** Atomically remove karma from a user, never going below 0. */
export async function revokeKarma(userId: string, amount: number, reason: string) {
  if (!userId) return null
  console.log(`Revoking ${amount} karma from ${userId} for: ${reason}`)
  try {
    return await queryOne<KarmaRow>(
      `UPDATE users SET karma = GREATEST(0, COALESCE(karma, 0) - $2) WHERE id = $1 RETURNING id, karma`,
      [userId, amount]
    )
  } catch (error) {
    console.error('Error updating karma:', error)
    return null
  }
}
