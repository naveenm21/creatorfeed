import 'server-only'
import { query, queryOne, isUuid } from '@/lib/db'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Thread columns safe to send to the browser.
 * Excludes ip_address / user_agent (rate-limit data) and the embedding vector.
 */
export const THREAD_PUBLIC_COLUMNS = `
  t.id, t.raw_submission, t.platform, t.creator_handle, t.follower_range, t.creator_name,
  t.user_id, t.submitted_by, t.intake_status, t.status, t.topic, t.what_tried, t.views,
  t.created_at, t.updated_at, t.source_url`

/** Same shape PostgREST returned for `agent_responses(count), human_replies(count)`. */
const COUNT_COLUMNS = `
  json_build_array(json_build_object('count',
    (SELECT count(*)::int FROM agent_responses ar WHERE ar.thread_id = t.id))) AS agent_responses,
  json_build_array(json_build_object('count',
    (SELECT count(*)::int FROM human_replies hr WHERE hr.thread_id = t.id))) AS human_replies`

const CARD_COLUMNS = `
  t.id, t.topic, t.platform, t.creator_handle, t.submitted_by, t.raw_submission, t.views,
  t.created_at, ${COUNT_COLUMNS}`

/**
 * Visibility rule that RLS used to enforce: published threads are public,
 * other statuses only to their owner.
 */
const VISIBLE_TO = (viewerParam: string) =>
  `(t.status = 'published' OR (t.user_id IS NOT NULL AND t.user_id = ${viewerParam}))`

export interface ListOptions {
  platform?: string        // case-insensitive match
  orderBy?: 'created_at' | 'views'
  limit: number
  offset?: number
  ids?: string[]
  excludeId?: string
}

/** Published threads as feed cards (with agent/human reply counts). */
export async function listPublishedThreads(opts: ListOptions): Promise<any[]> {
  const where: string[] = [`t.status = 'published'`]
  const params: unknown[] = []
  if (opts.platform) {
    params.push(opts.platform)
    where.push(`lower(t.platform) = lower($${params.length})`)
  }
  if (opts.ids) {
    params.push(opts.ids.filter(isUuid))
    where.push(`t.id = ANY($${params.length}::uuid[])`)
  }
  if (opts.excludeId && isUuid(opts.excludeId)) {
    params.push(opts.excludeId)
    where.push(`t.id <> $${params.length}`)
  }
  const order = opts.orderBy === 'views' ? 't.views DESC NULLS LAST' : 't.created_at DESC'
  const limit = Math.min(Math.max(Math.trunc(opts.limit) || 1, 1), 1000)
  const offset = Math.max(Math.trunc(opts.offset ?? 0) || 0, 0) // ?page=abc / negative → 0
  params.push(limit, offset)
  return query(
    `SELECT ${CARD_COLUMNS} FROM threads t
      WHERE ${where.join(' AND ')}
      ORDER BY ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
}

/** Sidebar: most viewed published threads in the last `days` days. */
export async function trendingSidebar(days = 7, limit = 5) {
  return query<{ topic: string; views: number; id: string }>(
    `SELECT topic, views, id FROM threads
      WHERE status = 'published' AND created_at > now() - make_interval(days => $1)
      ORDER BY views DESC NULLS LAST LIMIT $2`,
    [days, limit]
  )
}

/** One thread (public columns) if the viewer may see it, else null. */
export async function getVisibleThread(id: string, viewerId: string | null): Promise<any | null> {
  if (!isUuid(id)) return null
  return queryOne(
    `SELECT ${THREAD_PUBLIC_COLUMNS} FROM threads t
      WHERE t.id = $1 AND ${VISIBLE_TO('$2::uuid')}`,
    [id, viewerId && isUuid(viewerId) ? viewerId : null]
  )
}

/** Everything the debate page renders for a published thread. */
export async function getDebateDetails(threadId: string) {
  const [responses, verdict, replies, questions] = await Promise.all([
    query(
      `SELECT * FROM agent_responses WHERE thread_id = $1
        ORDER BY round_number ASC, response_order ASC`,
      [threadId]
    ),
    queryOne(`SELECT * FROM verdicts WHERE thread_id = $1`, [threadId]),
    query(
      `SELECT hr.*,
              CASE WHEN u.id IS NULL THEN NULL
                   ELSE json_build_object('id', u.id, 'karma', u.karma, 'badges', u.badges) END AS author
         FROM human_replies hr LEFT JOIN users u ON u.id = hr.user_id
        WHERE hr.thread_id = $1
        ORDER BY hr.created_at ASC`,
      [threadId]
    ),
    query(
      `SELECT * FROM intake_questions WHERE thread_id = $1 ORDER BY question_order ASC`,
      [threadId]
    ),
  ])
  return {
    agentResponses: responses.filter((r: any) => !r.is_final_position),
    finalPositions: responses.filter((r: any) => r.is_final_position),
    verdict,
    humanReplies: replies,
    intakeQuestions: questions,
  }
}

/** Up to 3 related debates: vector similarity first, same-platform fallback. */
export async function getRelatedDebates(threadId: string, platform: string | null) {
  const matches = await query<{ id: string }>(
    `SELECT id FROM match_threads(
        (SELECT embedding FROM threads WHERE id = $1), 0.5, 3, $1)`,
    [threadId]
  )
  if (matches.length > 0) {
    return listPublishedThreads({ ids: matches.map(m => m.id), limit: 3 })
  }
  return listPublishedThreads({
    platform: platform || 'Multi-platform',
    excludeId: threadId,
    limit: 3,
  })
}
