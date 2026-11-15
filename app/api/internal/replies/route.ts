import { NextResponse } from 'next/server'
import { queryOne, isUuid } from '@/lib/db'
import { isInternalRequest } from '@/lib/internal'

/** Internal: insert a non-user community reply (used by the auto-scraper). */
export async function POST(request: Request) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { threadId, authorName, replyText } = await request.json()
  if (!isUuid(threadId) || typeof replyText !== 'string' || !replyText.trim()) {
    return NextResponse.json({ error: 'threadId and replyText required' }, { status: 400 })
  }
  const reply = await queryOne(
    `INSERT INTO human_replies (thread_id, user_id, author_name, reply_text)
     VALUES ($1, NULL, $2, $3) RETURNING id`,
    [threadId, authorName || 'Community Perspective', replyText]
  )
  return NextResponse.json({ success: true, reply })
}
