import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { upsertOAuthUser } from '@/lib/users'

/**
 * Auth.js (NextAuth v5) — replaces Supabase Auth.
 * Env: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET (and AUTH_URL behind a proxy if needed).
 * Sessions are stateless JWT cookies; the user row lives in public.users.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/signin' },
  trustHost: true,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        return Boolean(profile?.email && profile.email_verified)
      }
      return false
    },
    async jwt({ token, account, profile }) {
      // Only on initial sign-in: map the Google identity to our users row.
      if (account && profile?.email) {
        const user = await upsertOAuthUser({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          email: profile.email,
          name: profile.name as string | undefined,
          image: profile.picture as string | undefined,
        })
        token.uid = user.id
        token.name = user.full_name ?? profile.name ?? null
        token.picture = user.avatar_url ?? (profile.picture as string | undefined) ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string
      return session
    },
  },
})

/** Server-side helper: the signed-in user (id, email, name, image) or null. */
export async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
}
