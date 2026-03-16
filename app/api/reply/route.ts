import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { threadId, agentReferenced, sentiment, replyText, authorName } = body

    if (!threadId || !replyText) {
      return NextResponse.json(
        { error: 'Thread ID and reply required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('human_replies')
      .insert({
        thread_id: threadId,
        agent_referenced: agentReferenced || null,
        sentiment: sentiment || null,
        reply_text: replyText,
        author_name: authorName || 'Anonymous'
      })
      .select()
      .single()

    if (error) {
      console.error('Reply insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save reply' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reply: data })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Reply failed' }, { status: 500 })
  }
}
