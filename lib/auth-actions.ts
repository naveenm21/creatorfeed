'use client'

import { signIn, signOut as nextAuthSignOut } from 'next-auth/react'

export async function signInWithGoogle(redirectTo?: string) {
  await signIn('google', { callbackUrl: redirectTo || '/' })
}

export async function signOut() {
  await nextAuthSignOut({ callbackUrl: '/' })
}
