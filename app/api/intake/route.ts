import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { INTAKE_AGENT_PROMPT } from '@/lib/agents'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { rawSubmission, userId } = await request.json()

    if (!rawSubmission || rawSubmission.length < 20) {
      return NextResponse.json(
        { error: 'Submission too short' },
        { status: 400 }
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: INTAKE_AGENT_PROMPT,
      messages: [
        { 
          role: 'user', 
          content: `Creator submission:\n${rawSubmission}` 
        }
      ]
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '{}'

    let intakeData
    try {
      const clean = responseText
        .replace(/```json\n?|\n?```/g, '')
        .trim()
      intakeData = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse intake response' },
        { status: 500 }
      )
    }

    const { data: thread, error: threadError } = 
      await supabase
        .from('threads')
        .insert({
          raw_submission: rawSubmission,
          platform: intakeData.extracted?.platform || null,
          follower_range: intakeData.extracted?.follower_range || null,
          topic: intakeData.extracted?.topic || 
            rawSubmission.substring(0, 100),
          intake_status: intakeData.questions?.length > 0 
            ? 'questioned' : 'ready',
          status: 'pending',
          user_id: userId || null,
          submitted_by: 'Anonymous'
        })
        .select()
        .single()

    if (threadError) {
      console.error('Thread insert error:', threadError)
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      )
    }

    if (intakeData.questions?.length > 0) {
      const questionsToInsert = intakeData.questions.map(
        (q: {
          question_text: string
          question_type: string
          question_order: number
          options?: string[]
          is_required: boolean
        }) => ({
          thread_id: thread.id,
          question_text: q.question_text,
          question_type: q.question_type,
          question_order: q.question_order,
          options: q.options ? q.options : null,
          answer: null,
          is_required: q.is_required
        })
      )

      await supabase
        .from('intake_questions')
        .insert(questionsToInsert)
    }

    return NextResponse.json({
      success: true,
      threadId: thread.id,
      questions: intakeData.questions || [],
      extracted: intakeData.extracted,
      needsQuestions: intakeData.questions?.length > 0
    })

  } catch (error) {
    console.error('Intake error:', error)
    return NextResponse.json(
      { error: 'Intake failed' },
      { status: 500 }
    )
  }
}
