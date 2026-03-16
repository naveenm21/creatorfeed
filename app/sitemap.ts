import { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()
  
  // Base URL
  const baseUrl = 'https://feed.creedom.ai'

  // Fetch all published threads
  const { data: threads } = await supabase
    .from('threads')
    .select('id, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Core static routes
  const routes = [
    '',
    '/trending',
    '/submit',
    '/how-it-works',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic debate routes
  const debateRoutes = (threads || []).map((thread) => ({
    url: `${baseUrl}/debate/${thread.id}`,
    lastModified: new Date(thread.created_at),
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }))

  return [...routes, ...debateRoutes]
}
