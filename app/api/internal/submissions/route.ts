import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { isInternalRequest } from '@/lib/internal'

export const dynamic = 'force-dynamic'

/** Internal: all raw submissions, used by seed/scraper scripts to skip duplicates. */
export async function GET(request: Request) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await query<{ raw_submission: string }>(`SELECT raw_submission FROM threads`)
  return NextResponse.json({ submissions: rows.map(r => r.raw_submission) })
}
