import { NextResponse } from 'next/server'
import { queryOne, isUuid } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Status only (used while a submitted debate is running). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const row = await queryOne<{ status: string }>(
    `SELECT status FROM threads WHERE id = $1`,
    [params.id]
  )
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ status: row.status })
}
