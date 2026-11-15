import { NextResponse } from 'next/server'
import { getSessionUser } from '@/auth'
import { getVisibleThread, getDebateDetails } from '@/lib/queries'

export const dynamic = 'force-dynamic'

/** Live debate data for DebateView polling (same visibility rule as the page). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const viewer = await getSessionUser()
  const thread = await getVisibleThread(params.id, viewer?.id ?? null)
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const details = await getDebateDetails(thread.id)
  return NextResponse.json({
    status: thread.status,
    agentResponses: details.agentResponses,
    finalPositions: details.finalPositions,
    verdict: details.verdict,
    humanReplies: details.humanReplies,
  })
}
