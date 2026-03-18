import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revokeKarma } from '@/lib/karma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerSupabaseClient()
    
    // 1. Validate Session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Verify Ownership
    const { data: reply, error: fetchError } = await supabase
      .from('human_replies')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (reply.user_id !== userId) {
      return NextResponse.json({ error: 'You can only delete your own replies' }, { status: 403 })
    }

    // 3. Delete Reply
    const { error: deleteError } = await supabase
      .from('human_replies')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 })
    }

    // 4. Revoke Karma (5 points for community reply)
    await revokeKarma(userId, 5, 'Deleted a community reply')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
