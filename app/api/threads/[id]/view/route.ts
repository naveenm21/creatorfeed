import { NextResponse } from 'next/server'
import { query, isUuid } from '@/lib/db'

/** Increment a thread's view counter (was the increment_views RPC). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await query(`SELECT increment_views($1)`, [params.id])
  return NextResponse.json({ success: true })
}
