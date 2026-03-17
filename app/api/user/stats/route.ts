import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('karma, badges')
      .eq('id', session.user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      karma: data?.karma || 0,
      badges: data?.badges || []
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
