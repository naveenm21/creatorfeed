import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/auth'
import { query, queryOne } from '@/lib/db'
import { revokeKarma } from '@/lib/karma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. Validate Session
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify Ownership
    const reply = await queryOne<{ user_id: string | null }>(
      `SELECT user_id FROM human_replies WHERE id = $1`,
      [id]
    ).catch(() => null)

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (reply.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own replies' }, { status: 403 })
    }

    // 3. Delete Reply (ownership re-checked in the WHERE clause)
    try {
      await query(`DELETE FROM human_replies WHERE id = $1 AND user_id = $2`, [id, user.id])
    } catch (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 })
    }

    // 4. Revoke Karma (5 points for community reply)
    await revokeKarma(user.id, 5, 'Deleted a community reply')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
