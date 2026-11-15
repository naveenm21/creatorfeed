import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { query, queryOne } from '@/lib/db'
import { getSessionUser } from '@/auth'
import { isInternalRequest } from '@/lib/internal'
import { INTAKE_AGENT_PROMPT } from '@/lib/agents'
import { awardKarma } from '@/lib/karma'
import { generateEmbedding } from '@/lib/embeddings'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const RATE_LIMIT_COUNT = 10
const RATE_LIMIT_WINDOW_HOURS = 1

export async function POST(request: NextRequest) {
  try {
    const isSeeded = isInternalRequest(request)
    const sessionUser = await getSessionUser()
    
    const body = await request.json()
    const { rawSubmission, submittedBy: bodySubmittedBy, platform: seededPlatform, followerRange: seededFollowerRange, sourceUrl } = body
    
    // Use verified userId and metadata if session exists
    const userId = sessionUser?.id || null
    const submittedBy = isSeeded ? 'Anonymous' : (
      bodySubmittedBy || 
      sessionUser?.name || 
      sessionUser?.email?.split('@')[0] || 
      'Anonymous'
    )

    // Get client identifiers for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const ua = request.headers.get('user-agent') || 'unknown'

    // Rate Limit Check
    if (!isSeeded) {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

      // Signed-in: per user. Anonymous: IP + UA (shared office networks share an IP)
      const recent = userId
        ? await queryOne<{ n: number }>(
            `SELECT count(*)::int AS n FROM threads WHERE created_at >= $1 AND user_id = $2`,
            [windowStart, userId])
        : await queryOne<{ n: number }>(
            `SELECT count(*)::int AS n FROM threads WHERE created_at >= $1 AND ip_address = $2 AND user_agent = $3`,
            [windowStart, ip, ua])

      if ((recent?.n ?? 0) >= RATE_LIMIT_COUNT) {
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
        { error: intakeData.off_topic_reason || 'This cannot be posted and this is a platform for content creators.' },
        { status: 400 }
      )
    }

    const embedding = await generateEmbedding(rawSubmission)
    let thread: { id: string } | null = null
    let threadError: unknown = null
    try {
      thread = await queryOne<{ id: string }>(
        `INSERT INTO threads
           (raw_submission, platform, follower_range, topic, intake_status, status,
            user_id, submitted_by, ip_address, user_agent, source_url, embedding)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11::vector)
         RETURNING id`,
        [
          rawSubmission,
          seededPlatform || intakeData.extracted?.platform || null,
          seededFollowerRange || intakeData.extracted?.follower_range || null,
          intakeData.extracted?.topic || rawSubmission.substring(0, 100),
          intakeData.questions?.length > 0 ? 'questioned' : 'ready',
          userId,
          submittedBy,
          ip,
          ua,
          sourceUrl || null,
          embedding.length ? JSON.stringify(embedding) : null,
        ]
      )
    } catch (e) {
      threadError = e
    }

    if (threadError || !thread) {
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
      for (const q of intakeData.questions as {
        question_text: string
        question_type: string
        question_order: number
        options?: string[]
        is_required: boolean
      }[]) {
        await query(
          `INSERT INTO intake_questions
             (thread_id, question_text, question_type, question_order, options, answer, is_required)
           VALUES ($1, $2, $3, $4, $5::jsonb, NULL, $6)`,
          [
            thread.id, q.question_text, q.question_type, q.question_order,
            q.options ? JSON.stringify(q.options) : null, q.is_required ?? true,
          ]
        )
      }
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
