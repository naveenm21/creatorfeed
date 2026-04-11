import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { INTAKE_AGENT_PROMPT } from '@/lib/agents'
import { awardKarma } from '@/lib/karma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const RATE_LIMIT_COUNT = 10
const RATE_LIMIT_WINDOW_HOURS = 1

export async function POST(request: NextRequest) {
  try {
    const isSeeded = 
      request.headers.get('x-service-role') === 
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const body = await request.json()
    const { rawSubmission, submittedBy: bodySubmittedBy } = body
    
    // Use verified userId and metadata if session exists
    const userId = session?.user.id || null
    const submittedBy = isSeeded ? 'Anonymous' : (
      bodySubmittedBy || 
      session?.user.user_metadata?.full_name || 
      session?.user.email?.split('@')[0] || 
      'Anonymous'
    )

    // Get client identifiers for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const ua = request.headers.get('user-agent') || 'unknown'

    // Rate Limit Check (Using Admin to bypass RLS)
    if (!isSeeded) {
      const sixHoursAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      
      let query = supabaseAdmin
        .from('threads')
        .select('id')
        .gte('created_at', sixHoursAgo)

      if (userId) {
        query = query.eq('user_id', userId)
      } else {
        // In a shared network (office), combine IP and UA to identify unique systems
        query = query.eq('ip_address', ip).eq('user_agent', ua)
      }

      const { data: recentThreads } = await query

      if (recentThreads && recentThreads.length >= RATE_LIMIT_COUNT) {
        const windowText = RATE_LIMIT_WINDOW_HOURS === 1 ? 'hour' : `${RATE_LIMIT_WINDOW_HOURS} hours`
        return NextResponse.json(
          { error: `Rate limit reached (${RATE_LIMIT_COUNT} submissions per ${windowText}). Please try again shortly.` },
          { status: 429 }
        )
      }
    }

    if (!rawSubmission || rawSubmission.length < 20) {
      return NextResponse.json(
        { error: 'Submission too short' },
        { status: 400 }
      )
    }

    if (rawSubmission.length > 2000) {
      return NextResponse.json(
        { error: 'Submission too long (max 2000 characters)' },
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

    if (intakeData.is_off_topic) {
      return NextResponse.json(
        { error: 'This cannot be posted and this is a platform for content creators.' },
        { status: 400 }
      )
    }

    const { data: thread, error: threadError } = 
      await supabaseAdmin
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
          user_id: userId,
          submitted_by: submittedBy,
          ip_address: ip,
          user_agent: ua
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

    // Award Karma for starting a debate
    if (userId) {
      await awardKarma(userId, 10, 'Started a new debate thread')
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

      await supabaseAdmin
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
