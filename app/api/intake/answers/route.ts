import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { isInternalRequest } from '@/lib/internal'

export async function POST(request: NextRequest) {
  try {
    const isSeeded = isInternalRequest(request)

    const { threadId, answers } = await request.json()

    if (isSeeded) {
      console.log(`Processing seeded answers for thread: ${threadId}`)
    }

    if (!threadId || !answers) {
      return NextResponse.json(
        { error: 'Thread ID and answers required' },
        { status: 400 }
      )
    }

    const overLimit = answers.find((a: {answer: string}) => a.answer.length > 2000)
    if (overLimit) {
      return NextResponse.json(
        { error: 'One or more answers exceed the 2000 character limit' },
        { status: 400 }
      )
    }

    for (const answer of answers) {
      await query(
        `UPDATE intake_questions SET answer = $1 WHERE thread_id = $2 AND question_order = $3`,
        [answer.answer, threadId, answer.question_order]
      )
    }

    const platformAnswer = answers.find(
      (a: {field?: string}) => a.field === 'platform'
    )
    const followerAnswer = answers.find(
      (a: {field?: string}) => a.field === 'follower_range'
    )

    await query(
      `UPDATE threads
          SET intake_status = 'ready',
              platform = COALESCE($2, platform),
              follower_range = COALESCE($3, follower_range)
        WHERE id = $1`,
      [threadId, platformAnswer?.answer ?? null, followerAnswer?.answer ?? null]
    )

    // Internal server-to-server call must use http://localhost — never the public HTTPS URL
    // (nginx handles TLS externally; the Node.js process is plain HTTP on port 3000)
    const port = process.env.PORT || 3000
    fetch(
      `http://localhost:${port}/api/debate`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        },
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
