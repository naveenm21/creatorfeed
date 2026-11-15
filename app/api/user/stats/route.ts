import { NextResponse } from 'next/server'
import { getSessionUser } from '@/auth'
import { queryOne } from '@/lib/db'

export async function GET() {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const data = await queryOne<{ karma: number | null; badges: string[] | null }>(
      `SELECT karma, badges FROM users WHERE id = $1`,
      [user.id]
    )

    return NextResponse.json({ 
      karma: data?.karma || 0,
      badges: data?.badges || []
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
