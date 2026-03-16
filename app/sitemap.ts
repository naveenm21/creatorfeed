import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()

  const { data: threads } = await supabase
    .from('threads')
    .select('id, created_at, updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const threadUrls = (threads || []).map(thread => ({
    url: `https://feed.creedom.ai/debate/${thread.id}`,
    lastModified: new Date(thread.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.8
  }))

  return [
    {
      url: 'https://feed.creedom.ai',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1.0
    },
    {
      url: 'https://feed.creedom.ai/trending',
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9
    },
    {
      url: 'https://feed.creedom.ai/how-it-works',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    },
    {
      url: 'https://feed.creedom.ai/submit',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    ...threadUrls
  ]
}
