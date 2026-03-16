'use client'

import { createClient } from '@/lib/supabase'

export async function signInWithGoogle(
  redirectTo?: string
) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback${
        redirectTo ? `?next=${redirectTo}` : ''
      }`,
    },
  })

  if (error) {
    console.error('Google sign in error:', error)
    throw error
  }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/'
}
