import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/auth'
import { queryOne } from '@/lib/db'
import { awardKarma } from '@/lib/karma'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Session
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { threadId, agentReferenced, sentiment, replyText, isAnonymous } = body

    if (!threadId || !replyText) {
      return NextResponse.json(
        { error: 'Thread ID and reply required' },
        { status: 400 }
      )
    }

    const uuidMatch = threadId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const parsedThreadId = uuidMatch ? uuidMatch[0] : threadId;

    // Map UI values to DB constraint values
    const sentimentMap: Record<string, string> = {
      agree: 'agreed',
      disagree: 'disagreed',
      agreed: 'agreed',
      disagreed: 'disagreed',
    }
    const mappedSentiment = sentiment ? (sentimentMap[sentiment] ?? null) : null

    // 2. Perform Insert with verified identity
    let data
    try {
      data = await queryOne(
        `INSERT INTO human_replies
           (thread_id, user_id, agent_referenced, sentiment, reply_text, author_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          parsedThreadId,
          user.id,
          agentReferenced || null,
          mappedSentiment,
          replyText,
          isAnonymous ? 'Anonymous' : (user.name || user.email.split('@')[0] || 'Anonymous'),
        ]
      )
    } catch (error) {
      console.error('SERVER-SIDE REPLY INSERT ERROR:', error)
      return NextResponse.json(
        { error: 'Failed to save reply' },
        { status: 500 }
      )
    }

    // Award Karma for community contribution
    await awardKarma(user.id, 5, 'Posted a community reply')

    return NextResponse.json({ success: true, reply: data })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Reply failed' }, { status: 500 })
  }
}
