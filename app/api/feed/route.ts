import { NextRequest, NextResponse } from 'next/server'
import { listPublishedThreads } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

/** Infinite-scroll feed. ?page=N is zero-based in rows of 20; optional ?platform=. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const page = Number.parseInt(sp.get('page') || '0', 10)
  const platform = sp.get('platform') || undefined
  const threads = await listPublishedThreads({
    platform,
    orderBy: 'created_at',
    limit: PAGE_SIZE,
    offset: (Number.isFinite(page) && page > 0 ? page : 0) * PAGE_SIZE,
  })
  return NextResponse.json({ threads })
}
