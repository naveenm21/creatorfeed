import 'server-only'
import { timingSafeEqual } from 'node:crypto'

/**
 * True when the request carries `Authorization: Bearer <INTERNAL_API_KEY>`.
 * Used by server-to-server calls and the seed/scraper scripts
 * (replaces the old x-service-role / Supabase service-role key check).
 */
export function isInternalRequest(request: Request): boolean {
  const key = process.env.INTERNAL_API_KEY
  if (!key) return false
  const header = request.headers.get('authorization') || ''
  const expected = Buffer.from(`Bearer ${key}`)
  const actual = Buffer.from(header)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
