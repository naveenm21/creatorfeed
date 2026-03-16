import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { threadId, answers } = await request.json()

    if (!threadId || !answers) {
      return NextResponse.json(
        { error: 'Thread ID and answers required' },
        { status: 400 }
      )
    }

    for (const answer of answers) {
      await supabase
        .from('intake_questions')
        .update({ answer: answer.answer })
        .eq('thread_id', threadId)
        .eq('question_order', answer.question_order)
    }

    const platformAnswer = answers.find(
      (a: {field?: string}) => a.field === 'platform'
    )
    const followerAnswer = answers.find(
      (a: {field?: string}) => a.field === 'follower_range'
    )

    const updateData: Record<string, string> = {
      intake_status: 'ready'
    }
    if (platformAnswer) {
      updateData.platform = platformAnswer.answer
    }
    if (followerAnswer) {
      updateData.follower_range = followerAnswer.answer
    }

    await supabase
      .from('threads')
      .update(updateData)
      .eq('id', threadId)

    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/debate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId })
      }
    ).catch(err => 
      console.error('Debate trigger error:', err)
    )

    return NextResponse.json({ 
      success: true, 
      threadId 
    })

  } catch (error) {
    console.error('Answers error:', error)
    return NextResponse.json(
      { error: 'Failed to save answers' },
      { status: 500 }
    )
  }
}
