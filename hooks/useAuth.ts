'use client'

import { useSession } from 'next-auth/react'

/**
 * Signed-in user, kept in the same shape the app used with Supabase
 * (id, email, user_metadata.full_name / avatar_url) so consumers don't change.
 */
export interface AppUser {
  id: string
  email: string
  user_metadata: { full_name?: string; avatar_url?: string }
}

export function useAuth(): { user: AppUser | null; loading: boolean } {
  const { data, status } = useSession()
  const u = data?.user
  const user: AppUser | null = u?.id
    ? {
        id: u.id,
        email: u.email ?? '',
        user_metadata: {
          full_name: u.name ?? undefined,
          avatar_url: u.image ?? undefined,
        },
      }
    : null
  return { user, loading: status === 'loading' }
}
