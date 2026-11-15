import { NextResponse } from 'next/server'
import { getSessionUser } from '@/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** The signed-in user's own threads (any status), with counts. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 })

  const threads = await query(
    `SELECT t.id, t.topic, t.platform, t.status, t.views, t.created_at,
            json_build_array(json_build_object('count',
              (SELECT count(*)::int FROM agent_responses ar WHERE ar.thread_id = t.id))) AS agent_responses,
            json_build_array(json_build_object('count',
              (SELECT count(*)::int FROM human_replies hr WHERE hr.thread_id = t.id))) AS human_replies
       FROM threads t
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC`,
    [user.id]
  )
  return NextResponse.json({ threads })
}
