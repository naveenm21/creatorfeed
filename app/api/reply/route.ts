import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 1. Validate Session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = session.user
    const body = await request.json()
    const { threadId, agentReferenced, sentiment, replyText } = body

    if (!threadId || !replyText) {
      return NextResponse.json(
        { error: 'Thread ID and reply required' },
        { status: 400 }
      )
    }

    // Map UI values to DB constraint values
    const sentimentMap: Record<string, string> = {
      agree: 'agreed',
      disagree: 'disagreed',
      agreed: 'agreed',
      disagreed: 'disagreed',
    }
    const mappedSentiment = sentiment ? (sentimentMap[sentiment] ?? null) : null

    // 2. Perform Insert with verified identity
    const { data, error } = await supabase
      .from('human_replies')
      .insert({
        thread_id: threadId,
        agent_referenced: agentReferenced || null,
        sentiment: mappedSentiment,
        reply_text: replyText,
        author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous'
      })
      .select()
      .single()

    if (error) {
      console.error('SERVER-SIDE REPLY INSERT ERROR:', error)
      return NextResponse.json(
        { error: 'Failed to save reply', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reply: data })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Reply failed' }, { status: 500 })
  }
}
